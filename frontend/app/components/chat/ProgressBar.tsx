import React from "react";
import { View } from "react-native";

type Props = {
  progress: number;
};

const ProgressBar: React.FC<Props> = ({ progress }) => (
  <View
    style={{
      height: 6,
      backgroundColor: "#e5e5e5",
      borderRadius: 3,
      marginBottom: 16,
      overflow: "hidden",
    }}
  >
    <View
      style={{
        height: "100%",
        width: `${Math.min(100, Math.max(0, progress * 100))}%`,
        backgroundColor: "#16a34a",
      }}
    />
  </View>
);

export default ProgressBar;
