# EdgePilot

Zero cold-start AI at the edge with Cloudflare Workers AI for Next.js applications.

## Features

- **Zero Cold Start**: Leverage Cloudflare's global edge network for instant AI responses
- **Next.js Integration**: Drop-in integration for Next.js 13.4+ with App Router
- **Streaming Support**: Real-time streaming responses with Server-Sent Events
- **Multiple Models**: Support for Llama, Mistral, and other Cloudflare AI models
- **Type-Safe**: Full TypeScript support with type definitions
- **Edge Runtime**: Optimized for edge deployment on Vercel, Cloudflare, and other platforms

## Installation

```bash
npm install edgepilot
# or
pnpm add edgepilot
# or
yarn add edgepilot
```

## Quick Start

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

- `@cf/meta/llama-3.3-70b-instruct` - Meta's latest 70B model
- `@cf/meta/llama-3.1-8b-instruct` - Fast lightweight model
- `@cf/mistral/mistral-7b-instruct-v0.2` - Efficient 7B model
- And many more...

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