"use client";
import React, { useState } from 'react';

type Props = {
  text: string;
  label?: string;
  className?: string;
};

export default function CopyButton({ text, label = 'Copy', className }: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <button
      onClick={onCopy}
      className={className || 'text-xs px-2 py-1 rounded-md border border-gray-700 text-gray-300 hover:bg-white/5'}
      aria-label={copied ? 'Copied' : 'Copy code'}
      title={copied ? 'Copied' : 'Copy code'}
      type="button"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

