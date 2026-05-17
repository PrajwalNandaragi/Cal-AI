import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { startSession } from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const onStart = async () => {
    setLoading(true);
    try {
      const res = await startSession();
      navigation.navigate("Chat", {
        initialCalml: res.calml,
        sessionReady: true,
      });
    } catch (e: unknown) {
      console.error("startSession error:", e);
      const err = e as { code?: string; response?: { status?: number } };
      if (err.code === "ERR_NETWORK" || !err.response) {
        Alert.alert(
          "Cannot connect",
          "Use the same Wi‑Fi as your PC, or ask to restart the Cloudflare tunnel on the computer."
        );
      } else {
        Alert.alert("Error", "Could not start. Wait a moment and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CalAI</Text>
      <Text style={styles.subtitle}>
        Your AI calisthenics coach. Let&apos;s build a plan tailored to you.
      </Text>
      <Pressable
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={onStart}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Start Assessment</Text>
        )}
      </Pressable>
      {loading && (
        <Text style={styles.hint}>Connecting to coach… (usually under 10 sec)</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 16 },
  subtitle: { fontSize: 16, marginBottom: 24, color: "#404040" },
  btn: {
    backgroundColor: "#16a34a",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  hint: { marginTop: 16, fontSize: 14, color: "#737373", textAlign: "center" },
});

export default WelcomeScreen;
