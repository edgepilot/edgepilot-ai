export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  stream?: boolean;
  model?: string;
  temperature?: number;
  provider?: string; // e.g. 'cloudflare' | 'openai'
}

export type DeltaEvent =
  | { type: "meta"; model?: string }
  | { type: "content"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };