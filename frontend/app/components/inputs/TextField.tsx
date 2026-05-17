import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, Platform } from "react-native";

type Props = {
  placeholder?: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
};

const TextField: React.FC<Props> = ({ placeholder, onSubmit, disabled }) => {
  const [value, setValue] = useState("");

  return (
    <View style={{ marginTop: 12 }} pointerEvents={disabled ? "none" : "auto"}>
      <TextInput
        value={value}
        placeholder={placeholder}
        editable={!disabled}
        onChangeText={setValue}
        onSubmitEditing={() => {
          const trimmed = value.trim();
          if (trimmed && !disabled) {
            onSubmit(trimmed);
            setValue("");
          }
        }}
        style={{
          borderWidth: 1,
          borderColor: "#d4d4d4",
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          backgroundColor: "#fff",
        }}
      />
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled || !value.trim()}
        onPress={() => {
          const trimmed = value.trim();
          if (trimmed) {
            onSubmit(trimmed);
            setValue("");
          }
        }}
        style={[
          {
            marginTop: 8,
            backgroundColor: "#16a34a",
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
            opacity: disabled || !value.trim() ? 0.5 : 1,
          },
          Platform.OS === "web" && ({ cursor: "pointer" } as object),
        ]}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TextField;
