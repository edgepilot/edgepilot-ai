# EdgePilot

[![npm version](https://img.shields.io/npm/v/edgepilot.svg)](https://www.npmjs.com/package/edgepilot)
[![npm downloads](https://img.shields.io/npm/dm/edgepilot.svg)](https://www.npmjs.com/package/edgepilot)

Backend API handlers for Cloudflare Workers AI integration in Next.js and Edge Runtime applications.

> **Looking for React components?** Check out [edgepilot-ui](https://www.npmjs.com/package/edgepilot-ui) for pre-built chat interfaces and components.

🎯 **[Examples](https://github.com/edgepilot/edgepilot/tree/main/examples)** | 📚 **[Docs](https://github.com/edgepilot/edgepilot#readme)** | 🌐 **[edgepilot.dev](https://edgepilot.dev)** (coming soon)

## What is EdgePilot?

EdgePilot provides backend API handlers that connect your Next.js app to Cloudflare Workers AI, enabling:
- **Zero cold-start AI inference** at the edge
- **90% lower costs** compared to OpenAI
- **Global edge deployment** on Cloudflare's network

## Why Backend-Only?

We believe in **separation of concerns**:
- Use ANY UI framework (React, Vue, Svelte)
- Bring your own component library (MUI, Ant, Tailwind)
- No forced UI opinions
- Smaller bundle size

Want pre-built components? Check out `edgepilot-ui`!

## Features

- **🚀 Zero Cold Start**: Leverage Cloudflare's global edge network for instant AI responses
- **⚡ Next.js Integration**: Drop-in API route handlers for Next.js 13.4+ App Router
- **📡 Streaming Support**: Real-time streaming responses with Server-Sent Events
- **🤖 Multiple Models**: Support for Llama 3.1, Mistral, Qwen, and 50+ other models
- **📦 Type-Safe**: Full TypeScript support with type definitions
- **🌍 Edge Runtime**: Optimized for Vercel Edge, Cloudflare Workers, and other edge platforms
- **🔄 Automatic Retries**: Built-in retry logic with exponential backoff
- **💾 Response Caching**: Optional caching for repeated queries

## Installation

```bash
npm install edgepilot
# or
pnpm add edgepilot
# or
yarn add edgepilot
```

## Quick Start

This package provides the **backend API handlers**. For a complete example with UI components, see our [starter example](https://github.com/edgepilot/edgepilot/tree/main/examples/starter).

### 1. Set up environment variables

Create a `.env.local` file:

```env
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

### 2. Create an API route

Create `app/api/ai/chat/route.ts`:

```typescript
import { createNextHandler } from 'edgepilot/next';

export const runtime = 'edge';

const handler = createNextHandler({
  model: '@cf/meta/llama-3.1-8b-instruct',
  stream: true,
});

export const POST = handler;
```

### 3. Use in your components

```tsx
import { useChat } from 'your-favorite-chat-library';

export function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/ai/chat',
  });

  return (
    <form onSubmit={handleSubmit}>
      <input value={input} onChange={handleInputChange} />
      <button type="submit">Send</button>
      {messages.map(m => (
        <div key={m.id}>{m.content}</div>
      ))}
    </form>
  );
}
```

## Available Models

EdgePilot supports all Cloudflare Workers AI models:

### Fast Response (Under 100ms)
- `@cf/meta/llama-3.1-8b-instruct` - Best for real-time chat
- `@cf/mistral/mistral-7b-instruct-v0.2` - Great for summaries
- `@cf/qwen/qwen1.5-7b-chat-awq` - Multilingual support

### High Quality (100-500ms)
- `@cf/meta/llama-3.3-70b-instruct` - State-of-the-art responses
- `@cf/meta/llama-3.1-70b-instruct` - Best for complex reasoning

### Specialized
- `@cf/meta/llama-3-8b-instruct-awq` - Ultra-fast with AWQ quantization
- `@cf/deepseek-ai/deepseek-math-7b-instruct` - Mathematical reasoning

See [all available models](https://developers.cloudflare.com/workers-ai/models/) in Cloudflare's documentation.

## API Reference

### `createNextHandler(options)`

Creates a Next.js API route handler for AI chat endpoints.

```typescript
const handler = createNextHandler({
  model: '@cf/meta/llama-3.1-8b-instruct', // AI model to use
  stream: true,                             // Enable streaming
  cache: false,                             // Response caching
  debug: false,                             // Debug logging
});
```

### Options

- `model` (string): The Cloudflare AI model to use
- `stream` (boolean): Enable streaming responses (default: true)
- `cache` (boolean): Enable response caching (default: false)
- `debug` (boolean): Enable debug logging (default: false)

## Examples

Check out the `examples/starter` directory for a complete working example with:

- Chat interface with streaming
- Model selection
- AI-enhanced textarea
- Theme support
- Mobile responsive design

To run the example:

```bash
cd examples/starter
pnpm install
pnpm dev
```

## Package Ecosystem

EdgePilot is part of a modular ecosystem:

| Package | Description | Status |
|---------|-------------|--------|
| **edgepilot** | Backend API handlers for Cloudflare Workers AI | ✅ Available |
| **edgepilot-ui** | Pre-built React components (ChatPopup, ModelSelector, etc.) | 🚧 Coming Soon |
| **create-edgepilot** | CLI to scaffold new projects | 📋 Planned |

This separation allows you to:
- Use just the backend with your own UI
- Use pre-built components with `edgepilot-ui`
- Mix and match based on your needs

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run in development mode
pnpm dev

# Run the example
pnpm example:dev
```

## License

MIT

## Author

Audrey Klammer

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Disclaimer

EdgePilot is an independent project and is not affiliated with, endorsed by, or associated with Open Text Corporation, Cloudflare, Inc., or any other company mentioned in this documentation. All trademarks are the property of their respective owners.