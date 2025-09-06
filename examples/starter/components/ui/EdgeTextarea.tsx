"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHomePageStore } from "../../stores/useHomePageStore";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export default function EdgeTextarea({ value, onChange, placeholder, className }: Props) {
  const [suggestion, setSuggestion] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isMac, setIsMac] = useState<boolean | null>(null);
  const { selectedModel } = useHomePageStore();
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const canSuggest = useMemo(() => value.trim().length > 0 && !loading, [value, loading]);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  const fetchSuggestion = useCallback(async () => {
    if (!canSuggest) return;
    setLoading(true);
    setSuggestion("");
    try {
      const messages = [
        { role: "system", content: "You are a concise writing assistant. Continue the user's text with 1-2 sentences." },
        { role: "user", content: value.slice(-4000) }
      ];
      const provider = (typeof window !== 'undefined' && (localStorage.getItem('edgecraft.provider') as any)) || 'cloudflare';
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages, stream: false, model: selectedModel, provider })
      });
      if (!res.ok) throw new Error("suggestion failed");
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      setSuggestion(text.trim());
    } catch {
      setSuggestion("");
    } finally {
      setLoading(false);
    }
  }, [canSuggest, selectedModel, value]);

  function accept() {
    if (!suggestion) return;
    const ta = taRef.current;
    if (!ta) {
      onChange(value + (value.endsWith(" ") ? "" : " ") + suggestion);
      setSuggestion("");
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const insert = (before.endsWith(" ") ? "" : " ") + suggestion;
    const next = before + insert + after;
    onChange(next);
    setSuggestion("");
    // place caret after insert
    requestAnimationFrame(() => {
      ta.focus();
      const pos = (before + insert).length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function dismiss() {
    setSuggestion("");
  }

  return (
    <div className="relative">
      <textarea
        ref={taRef}
        className={className}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          const isMacLocal = isMac ?? (typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent));
          const meta = isMacLocal ? e.metaKey : e.ctrlKey;
          
          if (meta && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            fetchSuggestion();
          }
          if (e.key === 'Tab' && suggestion) {
            e.preventDefault();
            accept();
          }
          if (e.key === 'Escape' && suggestion) {
            e.preventDefault();
            dismiss();
          }
        }}
      />

      {(suggestion || loading) && (
        <div className="absolute right-3 bottom-3 flex items-center gap-2 rounded-md border border-gray-700 bg-black/70 px-2 py-1 text-xs text-gray-200">
          {loading ? <span>Generating…</span> : <span className="max-w-[52ch] truncate">{suggestion}</span>}
          {!loading && (
            <>
              <button onClick={accept} className="px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10">Accept</button>
              <button onClick={dismiss} className="px-2 py-0.5 rounded border border-gray-600 text-gray-300 hover:bg-white/5">Dismiss</button>
            </>
          )}
        </div>
      )}

      <div className="absolute left-3 bottom-3 text-[10px] text-gray-500">
        Press {isMac === null ? 'Cmd/Ctrl' : isMac ? '⌘' : 'Ctrl'}+K for suggestion
      </div>
    </div>
  );
}
