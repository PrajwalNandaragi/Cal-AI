import React from "react";
import { Text } from "react-native";

type Props = {
  text: string;
};

const QuestionCard: React.FC<Props> = ({ text }) => (
  <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 8, color: "#171717" }}>
    {text}
  </Text>
);

export default QuestionCard;
