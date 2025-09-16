# EdgePilot AI Starter Example

A Next.js application demonstrating EdgePilot's AI assistant capabilities powered by Cloudflare Workers.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local
# Add your Cloudflare credentials to .env.local

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo.

## Features

- **AI Chat Interface**: Interactive chat popup with streaming responses
- **Model Selection**: Choose from multiple Cloudflare AI models
- **Theme Support**: Dark/light mode with system detection
- **Production Ready**: Built with Next.js 15 App Router

## Environment Variables

Create a `.env.local` file with:

```bash
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
```

## Learn More

- [EdgePilot Documentation](https://github.com/edgepilot/edgepilot-ai)
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Next.js Documentation](https://nextjs.org/docs)
