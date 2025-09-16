// Core types used across the EdgePilot AI package
export type Role = 'system' | 'user' | 'assistant' | string;

export interface Message {
  role: Role;
  content: string;
}

// Legacy alias for backwards compatibility
export interface ChatMessage extends Message {}

export interface Config {
  apiKey?: string;
  accountId?: string;
  model?: string;
  stream?: boolean;
  debug?: boolean;
  cache?: boolean;
  maxRetries?: number;
}

export interface ChatRequest {
  messages: Message[];
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

// Error classes
export class HttpError extends Error {
  status: number;
  publicMessage: string;
  constructor(status: number, publicMessage: string, debugMessage?: string) {
    super(debugMessage || publicMessage);
    this.status = status;
    this.publicMessage = publicMessage;
  }
}