export type CalNode =
  | { type: "text"; content: string }
  | { type: "question"; content: string }
  | { type: "progress"; value: number }
  | { type: "mc1"; options: { value: string; label: string }[] }
  | { type: "mcn"; options: { value: string; label: string }[] }
  | { type: "scale"; min: number; max: number }
  | { type: "input" }
  | { type: "yesno" }
  | { type: "done" }
  | { type: "plan"; children: CalNode[] }
  | { type: "section"; children: CalNode[] }
  | { type: "exercise"; children: CalNode[] }
  | { type: "tip"; content: string };

export type ParsedCalML = {
  nodes: CalNode[];
  displayQuestion: string;
};

function extractTag(raw: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = raw.match(regex);
  return match ? match[1].trim() : null;
}

function extractAllTextBlocks(raw: string): string[] {
  const regex = /<text>([\s\S]*?)<\/text>/gi;
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(raw)) !== null) {
    const t = m[1].trim();
    if (t) blocks.push(t);
  }
  return blocks;
}

function hasInputWidget(raw: string): boolean {
  return /<(mc1|mcn|scale|input|yesno)\b/i.test(raw);
}

function parseOptions(inner: string): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const withValue =
    /<option[^>]*value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/gi;
  let m: RegExpExecArray | null;
  while ((m = withValue.exec(inner)) !== null) {
    options.push({ value: m[1], label: m[2].trim() });
  }
  if (options.length > 0) {
    return options;
  }
  const plain = /<option[^>]*>([\s\S]*?)<\/option>/gi;
  while ((m = plain.exec(inner)) !== null) {
    const label = m[1].trim();
    options.push({ value: label.toLowerCase().replace(/\s+/g, "_"), label });
  }
  return options;
}

function parseProgress(raw: string): number | null {
  const closed = raw.match(/<progress>(\d+)<\/progress>/i);
  if (closed) {
    const v = parseInt(closed[1], 10);
    return Number.isNaN(v) ? null : v;
  }
  const attr = raw.match(/<progress[^>]*value="(\d+)"[^>]*\/?>/i);
  if (attr) {
    const v = parseInt(attr[1], 10);
    return Number.isNaN(v) ? null : v;
  }
  return null;
}

function parseSectionChildren(inner: string): CalNode[] {
  const children: CalNode[] = [];
  const text = extractTag(inner, "text");
  if (text) {
    children.push({ type: "text", content: text });
  }
  const tip = extractTag(inner, "tip");
  if (tip) {
    children.push({ type: "tip", content: tip });
  }
  const exerciseRegex = /<exercise>([\s\S]*?)<\/exercise>/gi;
  let ex: RegExpExecArray | null;
  while ((ex = exerciseRegex.exec(inner)) !== null) {
    const exInner = ex[1];
    const exChildren: CalNode[] = [];
    const exText = extractTag(exInner, "text");
    if (exText) {
      exChildren.push({ type: "text", content: exText });
    } else if (exInner.trim()) {
      exChildren.push({ type: "text", content: exInner.trim() });
    }
    children.push({ type: "exercise", children: exChildren });
  }
  return children;
}

function parsePlan(raw: string): CalNode | null {
  if (!/<plan>/i.test(raw)) {
    return null;
  }
  const planInner = extractTag(raw, "plan");
  if (!planInner) {
    return null;
  }
  const children: CalNode[] = [];
  const sectionRegex = /<section>([\s\S]*?)<\/section>/gi;
  let sec: RegExpExecArray | null;
  while ((sec = sectionRegex.exec(planInner)) !== null) {
    children.push({ type: "section", children: parseSectionChildren(sec[1]) });
  }
  if (children.length === 0) {
    children.push({ type: "text", content: planInner });
  }
  return { type: "plan", children };
}

function resolveDisplayQuestion(
  questionContent: string | null,
  textBlocks: string[],
  hasWidget: boolean
): string {
  if (questionContent) {
    return questionContent;
  }
  if (hasWidget && textBlocks.length > 0) {
    return textBlocks[textBlocks.length - 1];
  }
  if (hasWidget) {
    return "Please select an option:";
  }
  if (textBlocks.length > 0) {
    return textBlocks[textBlocks.length - 1];
  }
  return "";
}

export function parseCalML(raw: string): ParsedCalML {
  const nodes: CalNode[] = [];
  const cleaned = raw.trim();

  if (/<done\s*\/?>/i.test(cleaned)) {
    nodes.push({ type: "done" });
  }

  const plan = parsePlan(cleaned);
  if (plan && /<done\s*\/?>/i.test(cleaned)) {
    nodes.push(plan);
    return { nodes, displayQuestion: "" };
  }

  const textBlocks = extractAllTextBlocks(cleaned);
  const questionContent = extractTag(cleaned, "question");
  const usedAsQuestion =
    !questionContent &&
    hasInputWidget(cleaned) &&
    textBlocks.length > 0
      ? textBlocks[textBlocks.length - 1]
      : null;

  for (const block of textBlocks) {
    if (block !== usedAsQuestion) {
      nodes.push({ type: "text", content: block });
    }
  }

  const progressVal = parseProgress(cleaned);
  if (progressVal !== null) {
    nodes.push({ type: "progress", value: progressVal });
  }

  const finalQuestion = resolveDisplayQuestion(
    questionContent,
    textBlocks,
    hasInputWidget(cleaned)
  );
  if (finalQuestion) {
    nodes.push({ type: "question", content: finalQuestion });
  }

  const mc1Match = cleaned.match(/<mc1>([\s\S]*?)<\/mc1>/i);
  if (mc1Match) {
    const options = parseOptions(mc1Match[1]);
    if (options.length > 0) {
      nodes.push({ type: "mc1", options });
    }
  }

  const mcnMatch = cleaned.match(/<mcn>([\s\S]*?)<\/mcn>/i);
  if (mcnMatch) {
    const options = parseOptions(mcnMatch[1]);
    if (options.length > 0) {
      nodes.push({ type: "mcn", options });
    }
  }

  const scaleMatch = cleaned.match(
    /<scale[^>]*min="(\d+)"[^>]*max="(\d+)"[^>]*\/?>/i
  );
  if (scaleMatch) {
    nodes.push({
      type: "scale",
      min: parseInt(scaleMatch[1], 10),
      max: parseInt(scaleMatch[2], 10),
    });
  }

  if (/<yesno\s*\/?>/i.test(cleaned)) {
    nodes.push({ type: "yesno" });
  }

  if (/<input\s*\/?>/i.test(cleaned)) {
    nodes.push({ type: "input" });
  }

  return {
    nodes,
    displayQuestion: finalQuestion,
  };
}
