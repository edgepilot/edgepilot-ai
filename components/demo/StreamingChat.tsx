"use client";
import { useEffect, useRef, useState } from "react";
import { useHomePageStore } from "../../stores/useHomePageStore";
import ModelSelector from "./ModelSelector";

type Msg = { id?: string; role: "system" | "user" | "assistant" | string; content: string };
const MAX_HISTORY = 200;

const makeId = () => Math.random().toString(36).slice(2, 10);

function windowedPush(setter: React.Dispatch<React.SetStateAction<Msg[]>>, m: Msg) {
  setter((prev) => {
    const next = [...prev, m];
    return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
  });
}
type StreamStatus = "idle" | "pending" | "connecting" | "streaming" | "done" | "aborted" | "error";

export default function StreamingChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { id: makeId(), role: "system", content: "You are helpful." },
  ]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [ttft, setTtft] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [deltaCount, setDeltaCount] = useState(0);
  const [modelName, setModelName] = useState<string | undefined>();
  const [aborter, setAborter] = useState<AbortController | null>(null);
  const startAtRef = useRef<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const { selectedModel, setSelectedModel } = useHomePageStore();
  const sendDebounceRef = useRef<number | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('streamingChat.messages') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
      const storedModel = typeof window !== 'undefined' ? window.localStorage.getItem('streamingChat.model') : null;
      if (storedModel) setSelectedModel(storedModel);
    } catch {}
    return () => {
      // Cleanup on unmount only
      try { aborter?.abort(); } catch {}
      if (sendDebounceRef.current) window.clearTimeout(sendDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist messages & model
  useEffect(() => {
    try { window.localStorage.setItem('streamingChat.messages', JSON.stringify(messages)); } catch {}
  }, [messages]);
  useEffect(() => {
    try { window.localStorage.setItem('streamingChat.model', selectedModel); } catch {}
  }, [selectedModel]);

  // Auto-scroll the INTERNAL scroller (not the page) when near bottom
  useEffect(() => {
    if (!atBottom) return;
    const el = scrollRef.current;
    if (!el) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
    });
  }, [reply, messages.length, status, atBottom]);

  // Track scroll position
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 48; // px tolerance
    const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
    setAtBottom(isBottom);
  }

  // Render content with basic fenced code block support
  function renderContent(content: string) {
    if (!content.includes('```')) return <span className="whitespace-pre-wrap">{content}</span>;
    const parts = content.split('```');
    const nodes: React.ReactNode[] = [];
    parts.forEach((segment, i) => {
      if (i % 2 === 0) {
        if (segment) nodes.push(<span key={`t-${i}`} className="whitespace-pre-wrap">{segment}</span>);
      } else {
        // segment may start with lang on first line
        const firstNL = segment.indexOf('\n');
        let lang = '';
        let code = segment;
        if (firstNL !== -1) {
          lang = segment.slice(0, firstNL).trim();
          code = segment.slice(firstNL + 1);
        }
        nodes.push(
          <pre key={`c-${i}`} className="mt-2 mb-2 overflow-x-auto rounded-md border border-gray-800 bg-black/60 p-3 text-gray-200">
            <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">{lang || 'code'}</div>
            <code className="whitespace-pre">{code}</code>
          </pre>
        );
      }
    });
    return <>{nodes}</>;
  }

  async function sendNow() {
    if (loading || aborter) return; // prevent re-entrancy
    const userMsg: Msg = { id: makeId(), role: "user", content: input };
    const toSend = [...messages, userMsg];
    windowedPush(setMessages, userMsg);
    setInput("");
    setReply("");
    setLoading(true);
    setStatus("connecting");
    setErrorMsg(null);
    setTtft(null);
    setElapsed(null);
    setCharCount(0);
    setDeltaCount(0);
    setModelName(undefined);
    const start = performance.now();
    startAtRef.current = start;

    const controller = new AbortController();
    setAborter(controller);

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: toSend, stream: true, model: selectedModel }),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      setLoading(false);
      const msg = res.status === 401 || res.status === 403
        ? "Unauthorized"
        : res.status === 429
        ? "Rate limit exceeded"
        : res.status === 503
        ? "Service unavailable"
        : `Error ${res.status}`;
      setErrorMsg(msg);
      setStatus("error");
      setAborter(null);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulated = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.replace(/\r/g, '').split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            if (!modelName) setModelName(json.model || selectedModel || '-');
            const delta = json.choices?.[0]?.delta ?? {};
            const content = delta.content || "";
            if (content) {
              if (ttft === null) {
                setTtft(performance.now() - start);
                setStatus("streaming");
              }
              accumulated += content;
              setReply((prev) => prev + content);
              setCharCount((c) => c + content.length);
              setDeltaCount((d) => d + 1);
            }
          } catch {}
        }
      }
      setStatus("done");
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setStatus("aborted");
      } else {
        setStatus("error");
        setErrorMsg("Request failed");
      }
    } finally {
      setLoading(false);
      setAborter(null);
      const end = performance.now();
      setElapsed(end - start);
      if (accumulated) {
        windowedPush(setMessages, { id: makeId(), role: "assistant", content: accumulated });
      }
      try { await reader.cancel(); } catch {}
    }
  }

  function send() {
    // Cancelable debounce: first click queues, second click within 600ms cancels
    if (sendDebounceRef.current) {
      window.clearTimeout(sendDebounceRef.current);
      sendDebounceRef.current = null;
      setToast('Canceled');
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 1200);
      setStatus('idle');
      return;
    }
    setStatus('pending');
    sendDebounceRef.current = window.setTimeout(async () => {
      sendDebounceRef.current = null;
      await sendNow();
    }, 600);
  }

  function abort() {
    if (aborter) {
      aborter.abort();
    }
  }

  function resetAll() {
    try { aborter?.abort(); } catch {}
    setMessages([{ role: "system", content: "You are helpful." }]);
    setReply("");
    setLoading(false);
    setStatus("idle");
    setTtft(null);
    setElapsed(null);
    setCharCount(0);
    setDeltaCount(0);
    setModelName(undefined);
    setAborter(null);
    setErrorMsg(null);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(null);
  }

  async function copyLast() {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    const text = reply || lastAssistant?.content || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setToast('Copied');
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 1500);
    } catch {}
  }

  function clearMetrics() {
    // Keep chat history and current reply; just reset metrics/errors
    setTtft(null);
    setElapsed(null);
    setCharCount(0);
    setDeltaCount(0);
    setModelName(undefined);
    setErrorMsg(null);
    if (!loading && !aborter) setStatus('idle');
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-800 bg-black/60 text-gray-300 px-3 py-2 text-xs">
        <div className="flex items-center gap-2 font-medium">
          <span className="text-gray-400">Status:</span>
          <span className={`px-2 py-0.5 rounded-full text-black ${
            status === 'streaming' ? 'bg-green-300' :
            status === 'connecting' ? 'bg-yellow-300' :
            status === 'done' ? 'bg-blue-300' :
            status === 'aborted' ? 'bg-rose-300' :
            status === 'error' ? 'bg-red-300' : 'bg-gray-300'
          }`}>
            {status}
          </span>
          {(status === 'connecting' || status === 'streaming' || status === 'pending') && <span aria-hidden>⏳</span>}
        </div>
        <div className="hidden sm:block">|</div>
        <div><b>Model:</b> {modelName || '-'}</div>
        <div className="hidden sm:block">|</div>
        <div><b>TTFT:</b> {ttft !== null ? `${Math.round(ttft)} ms` : '-'}</div>
        <div className="hidden sm:block">|</div>
        <div><b>Elapsed:</b> {elapsed !== null ? `${Math.round(elapsed)} ms` : '-'}</div>
        <div className="hidden sm:block">|</div>
        <div><b>Deltas:</b> {deltaCount}</div>
        <div className="hidden sm:block">|</div>
        <div><b>Chars:</b> {charCount}</div>
        <div className="hidden sm:block">|</div>
        {(() => {
          const showThroughput = status === 'done' && ttft !== null && elapsed !== null && elapsed > ttft;
          return (
            <div><b>Throughput:</b> {showThroughput ? `${(charCount / ((elapsed - ttft) / 1000)).toFixed(1)} ch/s` : '-'}</div>
          );
        })()}
        <div className="ml-auto flex items-center gap-2">
          {(status === 'connecting' || status === 'streaming') && (
            <button onClick={abort} className="px-2.5 py-1 rounded-md border border-rose-500/40 text-rose-300 hover:bg-rose-500/10">Stop</button>
          )}
          <button onClick={resetAll} disabled={loading} className="px-2.5 py-1 rounded-md border border-blue-500/40 text-blue-300 hover:bg-blue-500/10 disabled:opacity-50">Reset</button>
          <button onClick={clearMetrics} className="px-2.5 py-1 rounded-md border border-gray-600 text-gray-300 hover:bg-white/5">Clear Metrics</button>
          <button onClick={copyLast} disabled={!reply && !messages.some(m => m.role === 'assistant')} className="px-2.5 py-1 rounded-md border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50">Copy</button>
        </div>
      </div>
      {/* Model selector */}
      <div className="max-w-xl">
        <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
      </div>
      {toast && (
        <div className="inline-flex items-center gap-2 border border-emerald-900 bg-emerald-950 text-emerald-300 px-3 py-1.5 rounded-md text-xs">✓ {toast}</div>
      )}
      {status === 'error' && (
        <div className="border border-gray-700 bg-gray-900 text-rose-300 px-3 py-2 rounded-md text-xs">{errorMsg || 'Something went wrong'}</div>
      )}
      <div ref={scrollRef} onScroll={handleScroll} className="relative space-y-3 max-h-[50vh] overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={m.id || `${m.role}|${m.content.length || 0}|${i}`} className={`group relative rounded-lg border px-4 py-3 ${m.role === 'assistant' ? 'bg-gray-900/60 border-gray-800' : m.role === 'system' ? 'bg-gray-900/40 border-gray-800' : 'bg-black/40 border-gray-800'}`}>
            <div className="text-xs uppercase tracking-wide mb-1 text-gray-400">{m.role}</div>
            <div className="text-gray-200">{renderContent(m.content)}</div>
            <button
              onClick={async () => { try { await navigator.clipboard.writeText(m.content); setToast('Copied'); if (toastTimer.current) window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 1200);} catch {} }}
              className="absolute top-2 right-2 hidden group-hover:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-gray-700 text-gray-300 hover:bg-white/5"
            >
              Copy
            </button>
          </div>
        ))}
        {(loading || reply) && (
          <div className="group relative rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3">
            <div className="text-xs uppercase tracking-wide mb-1 text-gray-400">assistant</div>
            <div className="text-gray-200">{renderContent(reply)}</div>
            <button
              onClick={async () => { try { await navigator.clipboard.writeText(reply); setToast('Copied'); if (toastTimer.current) window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 1200);} catch {} }}
              className="absolute top-2 right-2 hidden group-hover:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-gray-700 text-gray-300 hover:bg-white/5"
            >
              Copy
            </button>
          </div>
        )}
        <div ref={endRef} />
        {!atBottom && (
          <button
            type="button"
            onClick={() => { const el = scrollRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); setAtBottom(true); }}
            className="absolute right-3 bottom-3 px-2.5 py-1 rounded-md border border-gray-700 bg-black/60 text-gray-200 text-xs hover:bg-white/5"
          >
            Jump to newest ↓
          </button>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) send();
        }}
        className="flex items-end gap-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            const mod = e.ctrlKey || e.metaKey;
            if (e.key === 'Enter' && (mod || !e.shiftKey)) {
              e.preventDefault();
              if (input.trim()) send();
            }
          }}
          placeholder="Ask something… (Shift+Enter for newline)"
          rows={2}
          className="flex-1 resize-none rounded-md border border-gray-700 bg-black/50 text-gray-100 placeholder-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600"
        />
        <button
          disabled={!input || loading || status === 'connecting' || status === 'streaming' || status === 'pending'}
          className="px-4 py-2 rounded-md bg-white text-black font-medium disabled:opacity-40"
        >
          {status === 'pending' ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
