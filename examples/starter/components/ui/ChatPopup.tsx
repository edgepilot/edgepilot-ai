"use client";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useChat } from "./ChatProvider";
import type { ProviderName } from './ChatProvider';

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
  const inputHintId = useId();
  const chatLogId = useId();
  const shouldStickToBottom = useRef(true);
  const PAGE_SIZE = 200;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [emptyNotice, setEmptyNotice] = useState<string | null>(null);
  const emptyTimerRef = useRef<number | null>(null);

  // Memoized visible messages for better performance
  const visibleMessages = useMemo(
    () => (messages.length > visibleCount ? messages.slice(-visibleCount) : messages),
    [messages, visibleCount]
  );

  function showEmptyNotice() {
    setEmptyNotice('Type something first');
    if (emptyTimerRef.current) window.clearTimeout(emptyTimerRef.current);
    emptyTimerRef.current = window.setTimeout(() => setEmptyNotice(null), 1200);
    // Nudge focus back to the textarea
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (emptyTimerRef.current) window.clearTimeout(emptyTimerRef.current);
    };
  }, []);

  // Reset paging when chat opens
  useEffect(() => {
    if (open) setVisibleCount(PAGE_SIZE);
  }, [open]);

  // Grow window when new messages arrive, but keep the page size
  useEffect(() => {
    if (!open) return;
    setVisibleCount((c) => Math.min(Math.max(PAGE_SIZE, c), messages.length));
  }, [messages.length, open]);

  useEffect(() => {
    if (!open) return;
    // Move initial focus into the dialog for SR announcement, then to the textarea
    try { dialogRef.current?.focus({ preventScroll: true } as any); } catch {}
    requestAnimationFrame(() => { inputRef.current?.focus(); });
  }, [open]);

  // Auto-resize composer textarea for comfy input
  useEffect(() => {
    const el = inputRef.current;
    if (!open || !el) return;
    const resize = () => {
      el.style.height = '0px';
      el.style.height = el.scrollHeight + 'px';
    };
    el.addEventListener('input', resize);
    resize();
    return () => el.removeEventListener('input', resize);
  }, [open]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [open]);

  // iOS/mobile: contain overscroll bounce to the modal while open
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overscrollBehavior;
    document.documentElement.style.overscrollBehavior = 'none';
    return () => { document.documentElement.style.overscrollBehavior = prev; };
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

  // Improved auto-scroll behavior
  useEffect(() => {
    const el = listRef.current;
    if (!el || !shouldStickToBottom.current) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Skip smooth scroll if the jump is large
    const delta = el.scrollHeight - el.scrollTop - el.clientHeight;
    const behavior: ScrollBehavior = reduced || delta > 1200 ? 'auto' : 'smooth';
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior });
    });
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const val = inputRef.current?.value || "";
    if (!val.trim()) return showEmptyNotice();
    send(val);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.style.height = '0px';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  };

  return (
    <>
      {/* Launcher */}
      <button
        ref={launcherRef}
        onClick={() => setOpen(!open)}
        className="fixed right-4 bottom-4 z-30 h-12 w-12 rounded-full bg-white text-black shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        aria-label={open ? "Close chat" : "Open chat"}
        title={open ? "Close chat" : "Open chat"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
      >
        {open ? "×" : "✦"}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div
            className="absolute right-4 bottom-20 z-50 w-[420px] max-w-[95vw] rounded-lg border border-gray-800 bg-black text-gray-100 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
            aria-describedby={inputHintId}
            id={dialogId}
            ref={dialogRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key !== 'Tab') return;
              // Improved focus trap with proper else-if
              const root = dialogRef.current;
              if (!root) return;
              const focusable = Array.from(
                root.querySelectorAll<HTMLElement>(
                  'a[href],button,textarea,input,select,[tabindex]:not([tabindex="-1"])'
                )
              ).filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null);
              if (!focusable.length) return;
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              const active = (root.contains(document.activeElement) ? document.activeElement : null) as HTMLElement | null;
              if (!e.shiftKey && (active === last || !active) && first) {
                e.preventDefault();
                first.focus();
              } else if (e.shiftKey && (active === first || !active) && last) {
                e.preventDefault();
                last.focus();
              }
            }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
              <div id={labelId} className="text-sm font-medium">Edgecraft Chat</div>
              <div className="flex items-center gap-2">
                <label htmlFor="provider" className="sr-only">Model provider</label>
                <select
                  id="provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as ProviderName)}
                  className="text-xs bg-gray-900 border border-gray-700 rounded px-2 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <option value="cloudflare">Cloudflare</option>
                  <option value="openai">OpenAI</option>
                </select>
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60" aria-label="Close chat">
                  ×
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              id={chatLogId}
              className="h-80 overflow-y-auto scroll-smooth overscroll-contain px-3 py-3" 
              ref={listRef}
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.length > visibleCount && (
                <div className="flex gap-2 justify-center mb-3">
                  <button 
                    onClick={() => setVisibleCount(prev => Math.min(prev + PAGE_SIZE, messages.length))} 
                    className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    aria-controls={chatLogId}
                  >
                    Load earlier ({messages.length - visibleCount})
                  </button>
                  <button 
                    onClick={() => setVisibleCount(messages.length)} 
                    className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    aria-controls={chatLogId}
                  >
                    Load all
                  </button>
                </div>
              )}
              {visibleMessages.map(m => (
                <div key={m.id} className={`mb-3 ${m.role === "user" ? "text-blue-300" : m.role === "system" ? "text-gray-500 italic" : ""}`}>
                  <strong className="text-xs text-gray-500">{m.role}: </strong>
                  <span className="whitespace-pre-wrap">{m.content}</span>
                </div>
              ))}
              {loading && <div className="text-gray-400 text-sm italic">Thinking...</div>}
            </div>

            {/* Config Panel */}
            <details className="border-t border-gray-800">
              <summary className="px-3 py-2 text-xs text-gray-400 cursor-pointer hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">Config</summary>
              <div className="p-3 space-y-3 border-t border-gray-800">
                <div>
                  <label htmlFor={sysLabelId} className="block text-xs text-gray-400 mb-1">System Prompt</label>
                  <textarea
                    id={sysLabelId}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="You are a helpful assistant..."
                    rows={3}
                  />
                </div>
                <div>
                  <label htmlFor={tempId} className="block text-xs text-gray-400 mb-1">
                    Temperature: {temperature.toFixed(1)}
                  </label>
                  <input
                    id={tempId}
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    role="slider"
                    aria-valuenow={temperature}
                    aria-valuemin={0}
                    aria-valuemax={2}
                    aria-label="Temperature"
                  />
                </div>
              </div>
            </details>

            {/* Composer */}
            {emptyNotice && (
              <div role="status" aria-live="polite" className="px-3 pb-3 -mt-2 text-xs text-rose-300">
                {emptyNotice}
              </div>
            )}
            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-800">
              <div id={inputHintId} className="sr-only">Chat with AI. Press Enter to send or Shift+Enter for new line.</div>
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded p-2 text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  placeholder="Type a message..."
                  rows={1}
                  onKeyDown={(e) => {
                    // Handle IME composition
                    if ((e as any).isComposing) return;
                    const mod = e.ctrlKey || e.metaKey;
                    if (e.key === 'Enter' && (mod || !e.shiftKey)) {
                      e.preventDefault();
                      if (loading) return;
                      const val = inputRef.current?.value || "";
                      if (val.trim()) {
                        send(val);
                        if (inputRef.current) {
                          inputRef.current.value = "";
                          inputRef.current.style.height = '0px';
                          inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
                        }
                      } else {
                        showEmptyNotice();
                      }
                    }
                  }}
                  aria-describedby={inputHintId}
                />
                {inFlight ? (
                  <button 
                    type="button"
                    onClick={() => stop()}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-white hover:bg-gray-200 text-black rounded text-sm disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    Send
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}