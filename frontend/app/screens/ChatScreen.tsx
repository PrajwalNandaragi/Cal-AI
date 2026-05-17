import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { startSession, sendMessage } from "../services/api";
import { parseCalML, ParsedCalML } from "../calml/parser";
import CalMLRenderer from "../calml/renderer";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(!route.params?.sessionReady);
  const [parsed, setParsed] = useState<ParsedCalML | null>(
    route.params?.initialCalml
      ? parseCalML(route.params.initialCalml)
      : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("Loading coach…");
  const submittingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setStatus("Connecting…");
    try {
      const res = await startSession();
      if (!mountedRef.current) return;
      setParsed(parseCalML(res.calml));
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      console.error("startSession error:", e);
      const err = e as { response?: { status?: number }; message?: string; code?: string };
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        Alert.alert("Slow connection", "Request timed out. Use Wi‑Fi or try again.");
      } else if (err.response?.status === 500) {
        Alert.alert("Coach busy", "Rate limit — wait 1 minute and tap Retry below.");
      } else if (err.code === "ERR_NETWORK" || !err.response) {
        Alert.alert(
          "Connection error",
          "Cannot reach the server. Same Wi‑Fi as PC, or restart the tunnel on your computer."
        );
      } else {
        Alert.alert("Error", err.message ?? "Something went wrong.");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!route.params?.sessionReady) {
      loadSession();
    }
  }, [loadSession, route.params?.sessionReady]);

  const handleSubmitAnswer = useCallback(
    async (value: string) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setStatus("Thinking…");
      try {
        const res = await sendMessage(value);
        if (!mountedRef.current) return;
        if (res.done) {
          navigation.replace("Plan", { planCalml: res.calml });
          return;
        }
        setParsed(parseCalML(res.calml));
      } catch (e: unknown) {
        if (!mountedRef.current) return;
        console.error("sendMessage error:", e);
        const err = e as { response?: { status?: number }; code?: string; message?: string };
        if (err.code === "ECONNABORTED") {
          Alert.alert("Timed out", "Answer took too long. Tap your choice again.");
        } else if (err.response?.status === 500) {
          Alert.alert("Try again", "Coach glitch — tap your answer again.");
        } else if (err.code === "ERR_NETWORK" || !err.response) {
          Alert.alert("Connection lost", "Check Wi‑Fi and try again.");
        } else {
          Alert.alert("Error", "Failed to send. Please try again.");
        }
      } finally {
        submittingRef.current = false;
        if (mountedRef.current) {
          setSubmitting(false);
          setStatus("");
        }
      }
    },
    [navigation]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>{status}</Text>
        <Pressable style={styles.retryBtn} onPress={loadSession}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="always"
      nestedScrollEnabled
    >
      {parsed ? (
        <CalMLRenderer
          parsed={parsed}
          onSubmitAnswer={handleSubmitAnswer}
          disabled={submitting}
        />
      ) : (
        <View>
          <Text>No response from coach.</Text>
          <Pressable style={styles.retryBtn} onPress={loadSession}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}
      {submitting && (
        <View style={styles.thinkingOverlay}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.thinkingText}>
            {status || "Sending answer… please wait"}
          </Text>
          <Text style={styles.thinkingHint}>On 5G this can take 10–20 seconds</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText: { marginTop: 12, fontSize: 16, color: "#525252" },
  retryBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#16a34a",
  },
  retryText: { color: "#16a34a", fontSize: 16, fontWeight: "600" },
  thinkingOverlay: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  thinkingText: { fontSize: 16, color: "#171717", marginTop: 12, fontWeight: "600" },
  thinkingHint: { fontSize: 13, color: "#737373", marginTop: 6, textAlign: "center" },
});

export default ChatScreen;
