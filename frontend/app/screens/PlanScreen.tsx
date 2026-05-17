import React from "react";
import { ScrollView, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { parseCalML } from "../calml/parser";
import CalMLRenderer from "../calml/renderer";

type Props = NativeStackScreenProps<RootStackParamList, "Plan">;

const PlanScreen: React.FC<Props> = ({ route }) => {
  const { planCalml } = route.params;
  const parsed = parseCalML(planCalml);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <CalMLRenderer
        parsed={parsed}
        onSubmitAnswer={() => {}}
      />
    </ScrollView>
  );
};

export default PlanScreen;