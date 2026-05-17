import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../screens/WelcomeScreen";
import ChatScreen from "../screens/ChatScreen";
import LoadingScreen from "../screens/LoadingScreen";
import PlanScreen from "../screens/PlanScreen";

export type RootStackParamList = {
  Welcome: undefined;
  Chat: { initialCalml?: string; sessionReady?: boolean } | undefined;
  Loading: undefined;
  Plan: { planCalml: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Welcome">
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Plan" component={PlanScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default RootNavigator;