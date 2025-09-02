"use client";
import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from "react";
import { useHomePageStore } from "../../stores/useHomePageStore";

export type ChatMessage = { role: "system" | "user" | "assistant" | string; content: string };

type ChatContextType = {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  open: boolean;
  setOpen: (v: boolean) => void;
  send: (input: string) => Promise<void>;
  loading: boolean;
  stop: () => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", content: "You are helpful." },
  ]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const { selectedModel } = useHomePageStore();
  // Default values to avoid SSR/CSR mismatch; hydrate from localStorage on mount
  const [provider, setProvider] = useState<'cloudflare'|'openai'>('cloudflare');
  const [systemPrompt, setSystemPrompt] = useState<string>('You are helpful.');
  const [temperature, setTemperature] = useState<number>(0.7);
  useEffect(() => {
    try {
      const savedProvider = localStorage.getItem('edgecraft.provider') as any;
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
    const user = { role: "user", content: input } as ChatMessage;
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
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta;
            const content = delta?.content || "";
            if (content) {
              reply += content;
              // Optimistically reflect streaming in the view
              setMessages((prev) => {
                const base = prev.filter((m) => m.role !== "assistant" || m.content !== "__streaming__");
                return [...base, { role: "assistant", content: reply || "__streaming__" }];
              });
            }
          } catch {}
        }
      }
      // Finalize assistant message
      setMessages((prev) => {
        const base = prev.filter((m, i) => !(i === prev.length - 1 && m.role === "assistant"));
        return [...base, { role: "assistant", content: reply }];
      });
    } catch (e) {
      // On error, append a small assistant notice
      setMessages((prev) => [...prev, { role: "assistant", content: "(request failed)" }]);
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  }

  function stop() {
    try { controllerRef.current?.abort(); } catch {}
  }

  useEffect(() => { try { localStorage.setItem('edgecraft.provider', provider); } catch {} }, [provider]);
  useEffect(() => { try { localStorage.setItem('edgecraft.systemPrompt', systemPrompt); } catch {} }, [systemPrompt]);
  useEffect(() => { try { localStorage.setItem('edgecraft.temperature', String(temperature)); } catch {} }, [temperature]);
  const value = useMemo(() => ({ messages, setMessages, open, setOpen, send, loading, stop, systemPrompt, temperature, provider, setProvider, setSystemPrompt, setTemperature }), [messages, open, loading, systemPrompt, temperature, provider]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
