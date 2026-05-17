import axios from "axios";
import { Platform } from "react-native";
import { StartSessionResponse, MessageResponse, PlanResponse } from "./types";

const SESSION_KEY = "calai_session_id";

function defaultApiBase(): string {
  if (Platform.OS === "web") {
    return process.env.EXPO_PUBLIC_API_BASE_WEB ?? "http://localhost:8080";
  }
  return process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:8080";
}

const API_BASE = defaultApiBase();

const client = axios.create({
  baseURL: API_BASE,
  timeout: 45000,
});

let sessionId: string | null = null;

function loadStoredSession() {
  if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      sessionId = stored;
      client.defaults.headers.common["X-Session-Id"] = stored;
    }
  }
}

function saveSession(id: string) {
  sessionId = id;
  client.defaults.headers.common["X-Session-Id"] = id;
  if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, id);
  }
}

function clearSession() {
  sessionId = null;
  delete client.defaults.headers.common["X-Session-Id"];
  if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

loadStoredSession();

export const startSession = async (): Promise<StartSessionResponse> => {
  const res = await client.post<StartSessionResponse>("/session/start");
  saveSession(res.data.sessionId);
  return res.data;
};

export const sendMessage = async (message: string): Promise<MessageResponse> => {
  if (!sessionId) {
    throw new Error("No session — go back and start again");
  }
  const res = await client.post<MessageResponse>("/session/message", { message });
  return res.data;
};

export const fetchPlan = async (): Promise<PlanResponse> => {
  if (!sessionId) throw new Error("No session");
  const res = await client.get<PlanResponse>(`/session/${sessionId}/plan`);
  return res.data;
};

export const endSession = async () => {
  if (!sessionId) return;
  await client.delete(`/session/${sessionId}`);
  clearSession();
};
