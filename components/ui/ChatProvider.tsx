"use client";
import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from "react";
import { useHomePageStore } from "../../stores/useHomePageStore";

export type ChatMessage = { id?: string; role: "system" | "user" | "assistant" | string; content: string };
export type ProviderName = 'cloudflare' | 'openai';

export type ChatContextType = {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  open: boolean;
  setOpen: (v: boolean) => void;
  send: (input: string) => Promise<void>;
  loading: boolean;
  inFlight: boolean;
  stop: () => void;
  systemPrompt: string;
  setSystemPrompt: React.Dispatch<React.SetStateAction<string>>;
  temperature: number;
  setTemperature: React.Dispatch<React.SetStateAction<number>>;
  provider: ProviderName;
  setProvider: React.Dispatch<React.SetStateAction<ProviderName>>;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  function newId(prefix: string): string {
    try {
      const uuid = (globalThis as any).crypto?.randomUUID?.();
      if (uuid) return `${prefix}-${uuid}`;
    } catch {}
    const t = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${t}-${rnd}`;
  }

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: newId('sys'), role: "system", content: "You are helpful." },
  ]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const streamIndexRef = useRef<number | null>(null);
  const { selectedModel } = useHomePageStore();
  // Default values to avoid SSR/CSR mismatch; hydrate from localStorage on mount
  const [provider, setProvider] = useState<ProviderName>('cloudflare');
  const [systemPrompt, setSystemPrompt] = useState<string>('You are helpful.');
  const [temperature, setTemperature] = useState<number>(0.7);
  useEffect(() => {
    try {
      const savedProvider = localStorage.getItem('edgecraft.provider') as ProviderName | null;
      if (savedProvider === 'openai' || savedProvider === 'cloudflare') setProvider(savedProvider);
      const savedPrompt = localStorage.getItem('edgecraft.systemPrompt');
      if (typeof savedPrompt === 'string' && savedPrompt.length) setSystemPrompt(savedPrompt);
      const rawTemp = localStorage.getItem('edgecraft.temperature');
      const num = rawTemp ? Number(rawTemp) : NaN;
      if (Number.isFinite(num)) setTemperature(num as number);
    } catch {}
  }, []);

  async function send(input: string) {
    if (!input.trim() || loading) return;
    const user = { id: newId('usr'), role: "user", content: input } as ChatMessage;
    const next = [...messages, user];
    setMessages(next);
    setLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;
    let reply = "";
    try {
      // Build messages with current system prompt
      const outMessages = next.map((m, i) => (i === 0 && m.role === 'system') ? { ...m, content: systemPrompt } : m);
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: outMessages, stream: true, model: selectedModel, provider, temperature }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error("network");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      streamIndexRef.current = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (let raw of lines) {
          // Trim CR and tolerate both `data:` and `data: ` prefixes
          raw = raw.replace(/\r$/, "");
          if (!raw.startsWith("data:")) continue;
          const data = raw.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta ?? {};
            const hasRole = !!delta.role;
            const contentChunk = delta.content ?? "";
            // If the first delta only carries a role, ensure a message exists
            if (streamIndexRef.current == null && (hasRole || contentChunk)) {
              setMessages((prev) => {
                const updated = [...prev];
                if (streamIndexRef.current == null) {
                  updated.push({ id: newId('asst'), role: 'assistant', content: '' });
                  streamIndexRef.current = updated.length - 1;
                }
                return updated;
              });
            }
            if (contentChunk) {
              reply += contentChunk;
              setMessages((prev) => {
                const updated = [...prev];
                const idx = streamIndexRef.current;
                if (idx == null) {
                  updated.push({ id: newId('asst'), role: 'assistant', content: reply });
                  streamIndexRef.current = updated.length - 1;
                } else if (updated[idx]) {
                  updated[idx] = { ...updated[idx], content: reply };
                }
                return updated;
              });
            }
          } catch {}
        }
      }
      // Ensure the last assistant message reflects the final reply
      setMessages((prev) => {
        const updated = [...prev];
        const idx = streamIndexRef.current;
        if (idx != null && updated[idx]) {
          updated[idx] = { ...updated[idx], content: reply };
          return updated;
        }
        updated.push({ id: newId('asst'), role: 'assistant', content: reply });
        return updated;
      });
    } catch (e: any) {
      // Only append failure if not a user-initiated abort
      if (!(e?.name === 'AbortError' || controller.signal.aborted)) {
        setMessages((prev) => [...prev, { id: newId('asst'), role: "assistant", content: "(request failed)" }]);
      }
    } finally {
      setLoading(false);
      controllerRef.current = null;
      streamIndexRef.current = null;
    }
  }

  function stop() {
    try { controllerRef.current?.abort(); } catch {}
  }

  useEffect(() => { try { localStorage.setItem('edgecraft.provider', provider); } catch {} }, [provider]);
  useEffect(() => { try { localStorage.setItem('edgecraft.systemPrompt', systemPrompt); } catch {} }, [systemPrompt]);
  useEffect(() => { try { localStorage.setItem('edgecraft.temperature', String(temperature)); } catch {} }, [temperature]);
  const value = useMemo(() => ({
    messages,
    setMessages,
    open,
    setOpen,
    send,
    loading,
    inFlight: loading,
    stop,
    systemPrompt,
    temperature,
    provider,
    setProvider,
    setSystemPrompt,
    setTemperature,
  }), [messages, open, loading, systemPrompt, temperature, provider]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
