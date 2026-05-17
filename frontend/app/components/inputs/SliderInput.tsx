import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import Slider from "@react-native-community/slider";

type Props = {
  min: number;
  max: number;
  onSubmit: (value: number) => void;
  disabled?: boolean;
};

const SliderInput: React.FC<Props> = ({ min, max, onSubmit, disabled }) => {
  const [value, setValue] = useState(Math.round((min + max) / 2));

  return (
    <View style={{ marginTop: 16 }} pointerEvents={disabled ? "none" : "auto"}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
        {value}
      </Text>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        disabled={disabled}
        onValueChange={setValue}
        minimumTrackTintColor="#16a34a"
        maximumTrackTintColor="#d4d4d4"
      />
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        onPress={() => onSubmit(value)}
        style={[
          {
            marginTop: 12,
            backgroundColor: "#16a34a",
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
          },
          Platform.OS === "web" && ({ cursor: "pointer" } as object),
        ]}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SliderInput;
