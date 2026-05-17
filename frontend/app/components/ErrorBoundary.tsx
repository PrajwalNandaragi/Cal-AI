import React, { Component, ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.box}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            Don&apos;t shake to reload. Close Expo Go fully, reopen the app, and tap Start
            Assessment again.
          </Text>
          <Pressable
            style={styles.btn}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.btnText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f5f5f5" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  body: { fontSize: 16, color: "#525252", lineHeight: 22, marginBottom: 20 },
  btn: {
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
