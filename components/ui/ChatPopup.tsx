"use client";
import React, { useEffect, useId, useRef } from "react";
import { useChat } from "./ChatProvider";

export default function ChatPopup() {
  const { open, setOpen, messages, send, loading, inFlight, stop, systemPrompt, temperature, setSystemPrompt, setTemperature, provider, setProvider } = useChat();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const labelId = useId();
  const dialogId = useId();
  const sysLabelId = useId();
  const tempId = useId();
  const shouldStickToBottom = useRef(true);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Track if user is near bottom; only auto-scroll when near bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      shouldStickToBottom.current = nearBottom;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el && shouldStickToBottom.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length]);

  // Close on Escape and return focus to launcher on close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    }
    if (open) {
      window.addEventListener('keydown', onKey);
    } else {
      // restore focus to launcher when dialog closes
      launcherRef.current?.focus();
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  return (
    <>
      {/* Launcher */}
      <button
        ref={launcherRef}
        onClick={() => setOpen(!open)}
        className="fixed right-4 bottom-4 z-40 h-12 w-12 rounded-full bg-white text-black shadow-lg hover:shadow-xl focus:outline-none"
        aria-label={open ? "Close chat" : "Open chat"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
      >
        {open ? "×" : "✦"}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div
            className="absolute right-4 bottom-20 w-[420px] max-w-[95vw] rounded-lg border border-gray-800 bg-black text-gray-100 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
            id={dialogId}
            ref={dialogRef}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key !== 'Tab') return;
              // Simple focus trap
              const root = dialogRef.current;
              if (!root) return;
              const focusable = Array.from(
                root.querySelectorAll<HTMLElement>(
                  'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
                )
              ).filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null);
              if (focusable.length === 0) return;
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              const active = document.activeElement as HTMLElement | null;
              if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
              } else if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
              }
            }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
              <div id={labelId} className="text-sm font-medium">Edgecraft Chat</div>
              <div className="flex items-center gap-2">
                <select value={provider} onChange={(e) => setProvider(e.target.value as any)} className="bg-black border border-gray-700 text-gray-200 text-xs rounded px-2 py-1">
                  <option value="cloudflare">Cloudflare</option>
                  <option value="openai">OpenAI</option>
                </select>
                {inFlight ? (
                  <button onClick={stop} className="text-xs px-2 py-1 rounded border border-rose-500/40 text-rose-300 hover:bg-rose-500/10">Stop</button>
                ) : null}
                <button onClick={() => setOpen(false)} className="text-xl leading-none" aria-label="Close chat">×</button>
              </div>
            </div>

            {/* Controls */}
            <div className="px-3 py-2 border-b border-gray-800 grid grid-cols-1 gap-2">
              <label htmlFor={sysLabelId} className="text-[10px] uppercase tracking-wide text-gray-500">System Prompt</label>
              <input
                id={sysLabelId}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="rounded border border-gray-700 bg-black/50 text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <label htmlFor={tempId} className="sr-only">Temperature</label>
                <span aria-hidden>Temp</span>
                <span aria-hidden className="text-gray-500">0</span>
                <input
                  id={tempId}
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  aria-valuemin={0}
                  aria-valuemax={2}
                  aria-valuenow={Number(temperature.toFixed(1))}
                  aria-label="Temperature"
                  onChange={(e) => setTemperature(Number(e.target.value))}
                />
                <span aria-hidden className="text-gray-500">2</span>
                <span className="text-gray-300" aria-live="polite">{temperature.toFixed(1)}</span>
              </div>
            </div>

            {/* Messages */}
            <div ref={listRef} className="max-h-80 overflow-y-auto p-3 space-y-2">
              {messages.map((m, i) => (
                <div key={m.id || `${m.role}|${m.content.length}|${i}`} className={`rounded-lg px-3 py-2 border ${m.role === 'assistant' ? 'bg-gray-900/60 border-gray-800' : m.role === 'system' ? 'bg-gray-900/40 border-gray-800' : 'bg-black/40 border-gray-800'}`}>
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
                if (loading) return;
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
                    if (loading) return;
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
