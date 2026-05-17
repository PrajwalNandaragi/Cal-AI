import React from "react";
import { View, TouchableOpacity, Text, Platform } from "react-native";

type Props = {
  onSubmit: (value: boolean) => void;
  disabled?: boolean;
};

const YesNoToggle: React.FC<Props> = ({ onSubmit, disabled }) => {
  const renderBtn = (val: boolean, label: string) => (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={() => onSubmit(val)}
      style={[
        {
          flex: 1,
          padding: 12,
          marginHorizontal: 4,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#16a34a",
          backgroundColor: "#fff",
          alignItems: "center",
        },
        Platform.OS === "web" && ({ cursor: disabled ? "default" : "pointer" } as object),
      ]}
    >
      <Text style={{ fontSize: 16, fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flexDirection: "row", marginTop: 12 }} pointerEvents={disabled ? "none" : "auto"}>
      {renderBtn(true, "Yes")}
      {renderBtn(false, "No")}
    </View>
  );
};

export default YesNoToggle;
