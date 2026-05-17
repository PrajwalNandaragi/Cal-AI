import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
} from "react-native";

type Option = { value: string; label: string };

type Props = {
  options: Option[];
  onSubmit: (value: string) => void;
  disabled?: boolean;
};

const RadioGroup: React.FC<Props> = ({ options, onSubmit, disabled }) => {
  const handlePress = (opt: Option) => {
    if (disabled) return;
    onSubmit(opt.label);
  };

  return (
    <View style={{ marginTop: 12 }}>
      {options.map((opt, idx) => (
        <TouchableOpacity
          key={`${opt.value}-${idx}`}
          activeOpacity={0.7}
          disabled={disabled}
          onPress={() => handlePress(opt)}
          accessibilityRole="button"
          style={[
            {
              padding: 14,
              marginBottom: 8,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#16a34a",
              backgroundColor: "#fff",
              minHeight: 48,
              justifyContent: "center",
              opacity: disabled ? 0.6 : 1,
            },
            Platform.OS === "web" && ({ cursor: disabled ? "wait" : "pointer" } as object),
          ]}
        >
          <Text style={{ fontSize: 16, color: "#171717" }}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default RadioGroup;
