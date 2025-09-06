"use client";
import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from "react";
import { useHomePageStore } from "../../stores/useHomePageStore";

export type ChatMessage = { id?: string; role: "system" | "user" | "assistant"; content: string };
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
  reset: () => void;
  appendMessage: (m: ChatMessage) => void;
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
      const savedProvider = localStorage.getItem('edgepilot.provider') as ProviderName | null;
      if (savedProvider === 'openai' || savedProvider === 'cloudflare') setProvider(savedProvider);
      const savedPrompt = localStorage.getItem('edgepilot.systemPrompt');
      if (typeof savedPrompt === 'string' && savedPrompt.length) setSystemPrompt(savedPrompt);
      const rawTemp = localStorage.getItem('edgepilot.temperature');
      const num = rawTemp ? Number(rawTemp) : NaN;
      if (Number.isFinite(num)) setTemperature(Math.min(2, Math.max(0, num)));
    } catch {}
  }, []);

  async function send(input: string) {
    if (!input.trim() || loading) return;
    setLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;
    
    // Build the messages to send BEFORE updating state
    const user: ChatMessage = { id: newId('usr'), role: 'user', content: input };
    const currentMessages = messages;
    const firstMessage = currentMessages[0];
    const hasSystemFirst = currentMessages.length > 0 && firstMessage?.role === 'system';
    const ensuredSystem: ChatMessage = hasSystemFirst && firstMessage
      ? { ...firstMessage, content: systemPrompt }
      : { id: newId('sys'), role: 'system', content: systemPrompt };
    const rest: ChatMessage[] = hasSystemFirst ? currentMessages.slice(1) : currentMessages;
    const base: ChatMessage[] = [ensuredSystem, ...rest];
    const outMessages: ChatMessage[] = [...base, user];
    
    // Now update the UI state
    setMessages((prev) => [...prev, user]);
    
    let reply = "";
    try {
      // Send the messages we built
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: outMessages, stream: true, model: selectedModel || '@cf/meta/llama-3.1-8b-instruct', provider, temperature }),
        signal: controller.signal,
      });
      
      // Better error handling for non-OK responses
      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If not JSON, try text
          try {
            errorMessage = await res.text() || errorMessage;
          } catch {}
        }
        throw new Error(errorMessage);
      }
      
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      streamIndexRef.current = null;
      let raf = 0;
      const scheduleUpdate = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
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
        });
      };
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
                // Double-check we haven't already added an assistant message
                const lastMsg = updated[updated.length - 1];
                if (streamIndexRef.current == null && lastMsg?.role !== 'assistant') {
                  updated.push({ id: newId('asst'), role: 'assistant', content: '' });
                  streamIndexRef.current = updated.length - 1;
                } else if (lastMsg?.role === 'assistant') {
                  // Reuse the existing assistant message if one was already added
                  streamIndexRef.current = updated.length - 1;
                }
                return updated;
              });
            }
            if (contentChunk) {
              reply += contentChunk;
              scheduleUpdate();
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
        }
        // Don't create a new message if we didn't track one - something went wrong
        return updated;
      });
    } catch (e: any) {
      // Only append failure if not a user-initiated abort
      if (!(e?.name === 'AbortError' || controller.signal.aborted)) {
        console.error('Chat request failed:', e);
        const errorMessage = e?.message || 'Request failed';
        setMessages((prev) => [...prev, { id: newId('asst'), role: "assistant", content: `(Error: ${errorMessage})` }]);
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

  function reset() {
    try { controllerRef.current?.abort(); } catch {}
    streamIndexRef.current = null;
    setLoading(false);
    setMessages([{ id: newId('sys'), role: 'system', content: systemPrompt }]);
  }

  function appendMessage(m: ChatMessage) {
    setMessages((prev) => [...prev, m]);
  }

  useEffect(() => { try { localStorage.setItem('edgepilot.provider', provider); } catch {} }, [provider]);
  useEffect(() => { try { localStorage.setItem('edgepilot.systemPrompt', systemPrompt); } catch {} }, [systemPrompt]);
  useEffect(() => { try { localStorage.setItem('edgepilot.temperature', String(temperature)); } catch {} }, [temperature]);
  const value = useMemo(() => ({
    messages,
    setMessages,
    open,
    setOpen,
    send,
    loading,
    inFlight: loading,
    stop,
    reset,
    appendMessage,
    systemPrompt,
    temperature,
    provider,
    setProvider,
    setSystemPrompt,
    setTemperature,
  }), [messages, open, loading, systemPrompt, temperature, provider]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
