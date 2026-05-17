export interface StartSessionResponse {
  sessionId: string;
  calml: string;
}

export interface MessageResponse {
  calml: string;
  done: boolean;
}

export interface PlanResponse {
  planCalml: string;
}