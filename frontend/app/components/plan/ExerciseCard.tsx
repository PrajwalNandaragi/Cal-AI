import React from "react";
import { View, Text } from "react-native";
import { CalNode } from "../../calml/parser";

type Props = {
  content: CalNode[];
};

const ExerciseCard: React.FC<Props> = ({ content }) => (
  <View
    style={{
      marginVertical: 8,
      padding: 12,
      backgroundColor: "#f0fdf4",
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: "#16a34a",
    }}
  >
    {content.map((node, i) =>
      node.type === "text" ? (
        <Text key={i} style={{ fontSize: 15, lineHeight: 22 }}>
          {node.content}
        </Text>
      ) : null
    )}
  </View>
);

export default ExerciseCard;
