import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, Platform } from "react-native";

type Option = { value: string; label: string };

type Props = {
  options: Option[];
  onSubmit: (values: string[]) => void;
  disabled?: boolean;
};

const CheckboxGroup: React.FC<Props> = ({ options, onSubmit, disabled }) => {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected([]);
  }, [options]);

  const toggle = (label: string) => {
    if (disabled) return;
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]
    );
  };

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontSize: 14, color: "#737373", marginBottom: 8 }}>
        Select all that apply, then tap Continue
      </Text>
      {options.map((opt, idx) => {
        const isOn = selected.includes(opt.label);
        return (
          <TouchableOpacity
            key={`${opt.value}-${idx}`}
            activeOpacity={0.7}
            disabled={disabled}
            onPress={() => toggle(opt.label)}
            style={[
              {
                padding: 14,
                marginBottom: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isOn ? "#16a34a" : "#d4d4d4",
                backgroundColor: isOn ? "#dcfce7" : "#fff",
              },
              Platform.OS === "web" && ({ cursor: "pointer" } as object),
            ]}
          >
            <Text style={{ fontSize: 16 }}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled || selected.length === 0}
        onPress={() => onSubmit(selected)}
        style={{
          marginTop: 4,
          backgroundColor: "#16a34a",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
          opacity: selected.length === 0 ? 0.5 : 1,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CheckboxGroup;
