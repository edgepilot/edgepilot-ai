'use client';

import React from 'react';

export function ConfigStatusBadge({
  status,
}: {
  status: 'checking' | 'configured' | 'unconfigured' | 'error';
}) {
  const map = {
    checking: { text: 'Checking…', cls: 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' },
    configured: { text: 'Configured', cls: 'bg-green-900/30 text-green-400 border border-green-500/30' },
    unconfigured: { text: 'Not configured', cls: 'bg-red-900/30 text-red-400 border border-red-500/30' },
    error: { text: 'Error', cls: 'bg-red-900/30 text-red-400 border border-red-500/30' },
  }[status];
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs ${map.cls}`}>
      {map.text}
    </span>
  );
}