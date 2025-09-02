# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
# Development
pnpm dev          # Start development server on http://localhost:3000
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Package Management (uses pnpm v10.14.0)
pnpm install      # Install dependencies
pnpm add [pkg]    # Add new dependency
```

## Architecture Overview

This is a Next.js 15.4.6 application with React 19.1.0 that integrates custom local chat components with Cloudflare Workers AI via the CopilotEdge package.

### Core Integration Flow
1. **Frontend**: Local components (`ChatProvider`, `ChatPopup`, `EdgeTextarea`) handle UI interactions
2. **API Route**: `/api/ai/chat/route.ts` uses `createNextHandler` from `@edgecraft/copilotkit-workers-ai`
3. **Backend**: Routes requests to Cloudflare Workers AI models

### Key Files
- `app/api/ai/chat/route.ts` - Main API handler for AI requests
- `app/layout.tsx` - Wraps app with ChatProvider and includes ChatPopup
- `app/page.tsx` - Main demo page with model selector and interactive examples

### Environment Configuration

Required environment variables (create `.env.local` from `.env.local.example`):
```
CLOUDFLARE_API_TOKEN=your-api-token  # Required: Cloudflare API token with Workers AI permissions
CLOUDFLARE_ACCOUNT_ID=your-account   # Required: Cloudflare account ID
```

Optional configuration:
- `COPILOT_MODEL` - Override default model (default: `@cf/meta/llama-3.1-70b-instruct`)
- `COPILOT_DEBUG` - Enable debug logging (default: `true` in development)
- `COPILOT_CACHE_TIMEOUT` - Cache duration in ms (default: 120000)
- `COPILOT_RATE_LIMIT` - Requests per minute (default: 100)

### Available AI Models

The application supports multiple Cloudflare Workers AI models:
- `gpt-oss-120b` - OpenAI open-source 120B (best quality)
- `gpt-oss-20b` - OpenAI open-source 20B (faster)
- `@cf/meta/llama-3.3-70b-instruct` - Meta's latest 70B
- `@cf/meta/llama-3.1-8b-instruct` - Fast lightweight 8B
- `@cf/mistral/mistral-7b-instruct-v0.2` - Efficient 7B

### Testing

To verify the setup:
1. Check environment configuration status in the UI header
2. Test the chat popup (bottom-right corner)
3. Test AI-enhanced textarea with Cmd/Ctrl+K
4. Monitor browser console for debug logs in development
