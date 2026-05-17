package ai

import (
	"html"
	"regexp"
	"strings"
)

var (
	questionTagRe = regexp.MustCompile(`(?i)<question>[\s\S]*?</question>`)
	planTagRe     = regexp.MustCompile(`(?i)<plan>`)
	widgetRe      = regexp.MustCompile(`(?i)<(mc1|mcn|scale|input|yesno)\b`)
	textTagRe     = regexp.MustCompile(`(?i)<text>([\s\S]*?)</text>`)
)

// RepairAssessmentCalML fixes common model mistakes so the app always shows a question.
func RepairAssessmentCalML(raw string) string {
	raw = strings.TrimSpace(raw)
	raw = stripMarkdownFences(raw)

	if planTagRe.MatchString(raw) && strings.Contains(strings.ToLower(raw), "<done") {
		return raw
	}

	if questionTagRe.MatchString(raw) {
		return ensureAssessmentWidgets(raw)
	}

	// Model sent only <text> or text + options without <question>
	if widgetRe.MatchString(raw) {
		if loc := textTagRe.FindStringSubmatchIndex(raw); loc != nil && len(loc) >= 4 {
			q := strings.TrimSpace(raw[loc[2]:loc[3]])
			if q != "" {
				withoutText := raw[:loc[0]] + raw[loc[1]:]
				return "<question>" + q + "</question>\n" + withoutText
			}
		}
		return "<question>Please answer the following:</question>\n" + raw
	}

	if m := textTagRe.FindStringSubmatch(raw); len(m) > 1 {
		q := strings.TrimSpace(m[1])
		return "<question>" + q + "</question>\n<input />"
	}

	// If the model returned a plain list of lines (no tags) treat them as
	// multiple-choice options and convert to an <mc1> block so the app
	// reliably shows choices on mobile. Example input:
	// "1 day\n2 days\n3 days"
	if conv := convertPlainListToMC1(raw); conv != "" {
		return conv
	}

	return raw
}

// convertPlainListToMC1 converts a raw newline-separated list of options into
// a CalML <mc1> block. Returns empty string if the raw input doesn't look
// like a plain list.
func convertPlainListToMC1(raw string) string {
	// Ignore if there are any XML-like tags present.
	if strings.Contains(raw, "<") && strings.Contains(raw, ">") {
		return ""
	}
	lines := strings.Split(raw, "\n")
	opts := []string{}
	for _, ln := range lines {
		t := strings.TrimSpace(ln)
		if t == "" {
			continue
		}
		// Skip lines that look like prose sentences (too long) to avoid
		// misclassifying long paragraphs as option lists.
		if len(t) > 120 {
			return ""
		}
		opts = append(opts, t)
	}
	if len(opts) < 2 {
		return ""
	}

	// Build mc1 with escaped option text and a question wrapper if missing.
	var b strings.Builder
	// If the raw already contains a clear question prompt (ends with ?),
	// leave it as text above the options. Otherwise add a generic prompt.
	// Here we conservatively add a question only if none present.
	b.WriteString("<question>Please answer the following:</question>\n")
	b.WriteString("<mc1>\n")
	for _, o := range opts {
		b.WriteString("  <option>")
		b.WriteString(html.EscapeString(o))
		b.WriteString("</option>\n")
	}
	b.WriteString("</mc1>")
	return b.String()
}

func ensureAssessmentWidgets(raw string) string {
	if widgetRe.MatchString(raw) {
		return raw
	}
	if strings.Contains(strings.ToLower(raw), "<done") {
		return raw
	}
	return raw + "\n<input />"
}

func stripMarkdownFences(raw string) string {
	raw = strings.TrimSpace(raw)
	if strings.HasPrefix(raw, "```") {
		lines := strings.Split(raw, "\n")
		if len(lines) >= 2 {
			end := len(lines) - 1
			if strings.TrimSpace(lines[end]) == "```" {
				return strings.TrimSpace(strings.Join(lines[1:end], "\n"))
			}
		}
	}
	return raw
}

// ValidateAssessmentCalML ensures assessment turns are usable by the app.
func ValidateAssessmentCalML(raw string) error {
	if planTagRe.MatchString(raw) && strings.Contains(strings.ToLower(raw), "<done") {
		return nil
	}
	if !questionTagRe.MatchString(raw) {
		return errMissingQuestion
	}
	if !widgetRe.MatchString(raw) {
		return errMissingWidget
	}
	return nil
}
