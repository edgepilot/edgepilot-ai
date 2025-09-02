"use client";
import React, { useEffect, useRef, useState } from "react";
import { useChat } from "./ChatProvider";

export default function ChatPopup() {
  const { open, setOpen, messages, send, loading, stop, systemPrompt, temperature, setSystemPrompt, setTemperature } = useChat() as any;
  // Avoid SSR/CSR mismatch: set default, then hydrate from localStorage on mount
  const [provider, setProvider] = useState<'cloudflare'|'openai'>('cloudflare');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('edgecraft.provider') as any;
      if (saved === 'openai' || saved === 'cloudflare') setProvider(saved);
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem('edgecraft.provider', provider); } catch {} }, [provider]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-4 bottom-4 z-40 h-12 w-12 rounded-full bg-white text-black shadow-lg hover:shadow-xl focus:outline-none"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? "×" : "✦"}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute right-4 bottom-20 w-[420px] max-w-[95vw] rounded-lg border border-gray-800 bg-black text-gray-100 shadow-2xl">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
              <div className="text-sm font-medium">Edgecraft Chat</div>
              <div className="flex items-center gap-2">
                <select value={provider} onChange={(e) => setProvider(e.target.value as any)} className="bg-black border border-gray-700 text-gray-200 text-xs rounded px-2 py-1">
                  <option value="cloudflare">Cloudflare</option>
                  <option value="openai">OpenAI</option>
                </select>
                {loading ? (
                  <button onClick={stop} className="text-xs px-2 py-1 rounded border border-rose-500/40 text-rose-300 hover:bg-rose-500/10">Stop</button>
                ) : null}
                <button onClick={() => setOpen(false)} className="text-xl leading-none">×</button>
              </div>
            </div>

            {/* Controls */}
            <div className="px-3 py-2 border-b border-gray-800 grid grid-cols-1 gap-2">
              <label className="text-[10px] uppercase tracking-wide text-gray-500">System Prompt</label>
              <input
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="rounded border border-gray-700 bg-black/50 text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Temperature</span>
                <input type="range" min={0} max={2} step={0.1} value={temperature}
                       onChange={(e) => setTemperature(Number(e.target.value))} />
                <span className="text-gray-300">{temperature.toFixed(1)}</span>
              </div>
            </div>

            {/* Messages */}
            <div ref={listRef} className="max-h-80 overflow-y-auto p-3 space-y-2">
              {messages.map((m, i) => (
                <div key={i} className={`rounded-lg px-3 py-2 border ${m.role === 'assistant' ? 'bg-gray-900/60 border-gray-800' : m.role === 'system' ? 'bg-gray-900/40 border-gray-800' : 'bg-black/40 border-gray-800'}`}>
                  <div className="text-[10px] uppercase tracking-wide mb-1 text-gray-500">{m.role}</div>
                  <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                </div>
              ))}
            </div>

            {/* Composer */}
            <form
              className="p-3 border-t border-gray-800 flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const val = inputRef.current?.value || "";
                if (val.trim()) {
                  send(val);
                  if (inputRef.current) inputRef.current.value = "";
                }
              }}
            >
              <textarea
                ref={inputRef}
                rows={2}
                placeholder="Type a message… (Shift+Enter newline)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const val = inputRef.current?.value || "";
                    if (val.trim()) {
                      send(val);
                      if (inputRef.current) inputRef.current.value = "";
                    }
                  }
                }}
                className="flex-1 resize-none rounded-md border border-gray-700 bg-black/50 text-gray-100 placeholder-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
              <button disabled={loading} className="px-3 py-2 rounded-md bg-white text-black text-sm disabled:opacity-40">Send</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
