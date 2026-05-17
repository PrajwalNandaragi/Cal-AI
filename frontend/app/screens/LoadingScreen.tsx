import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

const LoadingScreen: React.FC = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" />
    <Text style={styles.text}>Generating your personalized plan...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { marginTop: 16 },
});

export default LoadingScreen;