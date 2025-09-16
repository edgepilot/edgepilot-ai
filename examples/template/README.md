# EdgePilot AI Template

A clean, minimal template for getting started with EdgePilot AI and Cloudflare Workers AI.

## Quick Start

1. **Copy this template** to your new project directory
2. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your Cloudflare credentials:
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
   - `CLOUDFLARE_API_TOKEN` - API token with Workers AI permissions

4. **Start the development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000) and start chatting!

## What's Included

- **Simple chat interface** - Clean, minimal UI for testing AI responses
- **EdgePilot AI integration** - Pre-configured API route at `/api/ai/chat`
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **Edge Runtime** - Optimized for Vercel Edge and Cloudflare Workers

## Customization

### Change AI Model

Edit `app/api/ai/chat/route.ts`:

```typescript
const handler = createNextHandler({
  model: '@cf/meta/llama-3.3-70b-instruct', // Change this
  stream: true,
  cache: false,
  debug: process.env.NODE_ENV !== 'production'
});
```

### Add Streaming

The template uses non-streaming responses by default. To enable streaming, modify your client code to handle Server-Sent Events.

### Styling

This template uses Tailwind CSS. Customize the design by editing:
- `app/globals.css` - Global styles
- `tailwind.config.ts` - Tailwind configuration
- `app/page.tsx` - Component styles

## Learn More

- [EdgePilot AI Documentation](https://github.com/edgepilot/edgepilot-ai)
- [Cloudflare Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [Next.js Documentation](https://nextjs.org/docs)

## Deploy

The easiest way to deploy is on [Vercel](https://vercel.com/):

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

Your EdgePilot AI app will run on Vercel's Edge Runtime for maximum performance.