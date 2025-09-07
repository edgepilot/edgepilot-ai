export interface CodeExample {
  title: string;
  description: string;
  fileName?: string;
  code: string;
}

export const codeExamples: CodeExample[] = [
  {
    title: "1. Create Your API Route",
    description: "Create app/api/ai/chat/route.ts:",
    fileName: "route.ts",
    code: `import { createNextHandler } from 'edgepilot-ai';

export const runtime = 'edge';

export const POST = createNextHandler({
  apiKey: process.env.CLOUDFLARE_API_TOKEN,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  model: '@cf/meta/llama-3.1-70b-instruct',
  stream: true,
  cache: false,
  maxRetries: 2,
  debug: process.env.NODE_ENV !== 'production'
});`
  },
  {
    title: "2. Setup Your Layout",
    description: "Wrap your app with the local ChatProvider and include ChatPopup in app/layout.tsx:",
    fileName: "layout.tsx",
    code: `import { ChatProvider } from '../components/ui/ChatProvider';
import ChatPopup from '../components/ui/ChatPopup';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ChatProvider>
          {children}
          <ChatPopup />
        </ChatProvider>
      </body>
    </html>
  );
}`
  },
  {
    title: "3. Use AI Components",
    description: "Use the local EdgeTextarea with built-in Cmd/Ctrl+K suggestions:",
    fileName: "MyComponent.tsx",
    code: `import { useState } from 'react';
import EdgeTextarea from '../components/ui/EdgeTextarea';

export function MyComponent() {
  const [text, setText] = useState('');
  return (
    <EdgeTextarea
      value={text}
      onChange={setText}
      placeholder="Type here... (Cmd/Ctrl+K for a suggestion)"
      className="w-full min-h-32 rounded-md border border-gray-700 bg-black/50 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600"
    />
  );
}`
  }
];

export interface ConfigOption {
  name: string;
  description: string;
}

export const handlerOptions: ConfigOption[] = [
  { name: 'apiKey', description: 'Cloudflare API token' },
  { name: 'accountId', description: 'Cloudflare account ID' },
  { name: 'model', description: 'AI model to use' },
  { name: 'stream', description: 'Enable streaming responses' },
  { name: 'cache', description: 'Enable in-memory cache' },
  { name: 'maxRetries', description: 'Retry count on failure' },
  { name: 'debug', description: 'Server-side debug logs' }
];
