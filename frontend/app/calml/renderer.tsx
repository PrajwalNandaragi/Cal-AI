import React from "react";
import { View, Text } from "react-native";
import { ParsedCalML, CalNode } from "./parser";
import QuestionCard from "../components/chat/QuestionCard";
import ProgressBar from "../components/chat/ProgressBar";
import RadioGroup from "../components/inputs/RadioGroup";
import CheckboxGroup from "../components/inputs/CheckboxGroup";
import SliderInput from "../components/inputs/SliderInput";
import YesNoToggle from "../components/inputs/YesNoToggle";
import TextField from "../components/inputs/TextField";
import PlanSection from "../components/plan/PlanSection";
import ExerciseCard from "../components/plan/ExerciseCard";

interface Props {
    parsed: ParsedCalML;
    onSubmitAnswer: (answer: string) => void;
    disabled?: boolean;
}

const CalMLRenderer: React.FC<Props> = ({ parsed, onSubmitAnswer, disabled }) => {
    const questionNode = parsed.nodes.find((n) => n.type === "question");
    const questionText =
        parsed.displayQuestion ||
        (questionNode?.type === "question" ? questionNode.content : "");
    const progressNode = parsed.nodes.find((n) => n.type === "progress");
    const mc1Node = parsed.nodes.find((n) => n.type === "mc1");
    const mcnNode = parsed.nodes.find((n) => n.type === "mcn");
    const scaleNode = parsed.nodes.find((n) => n.type === "scale");
    const yesnoNode = parsed.nodes.find((n) => n.type === "yesno");
    const inputNode = parsed.nodes.find((n) => n.type === "input");
    const planNode = parsed.nodes.find((n) => n.type === "plan");

    if (planNode && planNode.type === "plan") {
        return (
            <View>
                {planNode.children.map((child, idx) => {
                    if (child.type === "section") {
                        return (
                            <PlanSection key={idx}>
                                {child.children.map((c, j) => {
                                    if (c.type === "text") {
                                        return <Text key={j} style={{ marginBottom: 4 }}>{c.content}</Text>;
                                    }
                                    if (c.type === "exercise") {
                                        return <ExerciseCard key={j} content={c.children} />;
                                    }
                                    if (c.type === "tip") {
                                        return <Text key={j} style={{ fontStyle: "italic", marginVertical: 4 }}>{c.content}</Text>;
                                    }
                                    return null;
                                })}
                            </PlanSection>
                        );
                    }
                    return null;
                })}
            </View>
        );
    }

    const hasInput =
        mc1Node || mcnNode || scaleNode || yesnoNode || inputNode;
    const questionKey = questionText || "q";

    if (!questionText && !hasInput && !planNode) {
        return (
            <View style={{ padding: 8 }}>
                <Text style={{ fontSize: 16, color: "#737373" }}>
                    Waiting for the next question… tap Retry or go back and start again.
                </Text>
            </View>
        );
    }

    return (
        <View key={questionKey}>
            {parsed.nodes
                .filter((n) => n.type === "text")
                .map((n, i) =>
                    n.type === "text" ? (
                        <Text key={i} style={{ marginBottom: 8, fontSize: 16, color: "#404040" }}>
                            {n.content}
                        </Text>
                    ) : null
                )}
            {progressNode && progressNode.type === "progress" && (
                <ProgressBar progress={progressNode.value / 100} />
            )}
            {questionText ? (
                <QuestionCard text={questionText} />
            ) : null}

            {mc1Node && mc1Node.type === "mc1" && (
                <RadioGroup
                    key={`mc1-${questionKey}`}
                    options={mc1Node.options}
                    disabled={disabled}
                    onSubmit={(value) => onSubmitAnswer(value)}
                />
            )}
            {mcnNode && mcnNode.type === "mcn" && (
                <CheckboxGroup
                    key={`mcn-${questionKey}`}
                    options={mcnNode.options}
                    disabled={disabled}
                    onSubmit={(values) => onSubmitAnswer(values.join(", "))}
                />
            )}
            {scaleNode && scaleNode.type === "scale" && (
                <SliderInput
                    min={scaleNode.min}
                    max={scaleNode.max}
                    disabled={disabled}
                    onSubmit={(val) => onSubmitAnswer(String(val))}
                />
            )}
            {yesnoNode && (
                <YesNoToggle
                    disabled={disabled}
                    onSubmit={(val) => onSubmitAnswer(val ? "yes" : "no")}
                />
            )}
            {inputNode && (
                <TextField
                    placeholder="Type your answer..."
                    disabled={disabled}
                    onSubmit={(val) => onSubmitAnswer(val)}
                />
            )}
            {!hasInput && questionText && (
                <TextField
                    placeholder="Type your answer..."
                    disabled={disabled}
                    onSubmit={(val) => onSubmitAnswer(val)}
                />
            )}
        </View>
    );
};

export default CalMLRenderer;