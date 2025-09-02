'use client';

import React from 'react';
import { Providers } from '../providers/Providers';
import { NavigationContainer } from '../containers/NavigationContainer';
import { HeroContainer } from '../containers/HeroContainer';
import { SetupContainer } from '../containers/SetupContainer';
import { DemoContainer } from '../containers/DemoContainer';
import { CodeExamplesContainer } from '../containers/CodeExamplesContainer';
import StreamingChat from './StreamingChat';

export default function HomePage() {
  return (
    <Providers>
      <div className="min-h-screen bg-black text-white">
        <NavigationContainer />
        <HeroContainer />
        <SetupContainer />
        <DemoContainer />
        <div className="max-w-3xl mx-auto my-12 p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Live Streaming Chat Demo</h2>
          <p className="text-gray-400 mb-4 text-sm">This demo streams tokens from Cloudflare Workers AI via your Next.js route.</p>
          <StreamingChat />
        </div>
        <CodeExamplesContainer />
      </div>
    </Providers>
  );
}
