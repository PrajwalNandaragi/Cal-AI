import React from "react";
import { View } from "react-native";

type Props = {
  children: React.ReactNode;
};

const PlanSection: React.FC<Props> = ({ children }) => (
  <View
    style={{
      marginBottom: 20,
      padding: 16,
      backgroundColor: "#fff",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#e5e5e5",
    }}
  >
    {children}
  </View>
);

export default PlanSection;
