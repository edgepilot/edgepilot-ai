# 🚀 Edgecraft Starter App

A Next.js starter for building AI experiences with the **Edgecraft** connector and **Cloudflare Workers AI** (with optional OpenAI fallback). No vendor runtime required.

![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Quick Start

### 1. Setup Environment

Copy the example environment file and add your Cloudflare credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:
```env
CLOUDFLARE_API_TOKEN=your-api-token-here
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
```

Get your credentials from: https://dash.cloudflare.com/profile/api-tokens

### 2. Install & Run

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📦 What's Included

### Pages
- **Home Page** (`app/page.tsx`) - Interactive demo with:
  - AI-enhanced textarea with Cmd/Ctrl+K shortcuts
  - Floating chat popup
  - Model selector
  - Feature showcase

### API Routes
- **Edgecraft Handler** (`app/api/ai/chat/route.ts`) - OpenAI-compatible chat endpoint (Cloudflare by default, OpenAI fallback optional)

### Features Demonstrated
- ✅ Streaming chat (SSE) with status HUD
- ✅ Cmd/Ctrl+K autosuggest textarea
- ✅ Model selector + per-request override
- ✅ Provider toggle (Cloudflare/OpenAI)
- ✅ System prompt + temperature controls
- ✅ React 19 compatibility

## 🎯 How to Use

### 1. Chat Popup
Click the chat icon in the bottom-right corner to open the assistant. Use the header controls to switch provider (Cloudflare/OpenAI), set system prompt, and temperature.

### 2. AI-Enhanced Textarea
1. Click in the textarea
2. Start typing
3. Press **Cmd+K** (Mac) or **Ctrl+K** (Windows) to get AI suggestions

### 3. Switch Models
Use the model section to switch between different AI models:
- **GPT-OSS-120B** - OpenAI's open-source model (best quality)
- **GPT-OSS-20B** - Smaller, faster version
- **Llama 3.3 70B** - Meta's latest model
- **Llama 3.1 8B** - Fast, lightweight option
- **Mistral 7B** - Quick responses

## 🔧 Configuration Options

The Edgecraft handler reads from environment and request body:

- Env
  - `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`
  - Optional OpenAI fallback: `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o-mini`)
  - Optional default provider: `EDGECRAFT_PROVIDER=cloudflare|openai`
- Request body fields (JSON)
  - `messages`: Array<{ role, content }>
  - `model` (optional): per-request model slug (e.g., `@cf/meta/llama-3.1-8b-instruct`)
  - `provider` (optional): `cloudflare` | `openai`
  - `stream` (optional): boolean
  - `temperature` (optional): number (0–2)

## 📚 Available Models (examples)

### OpenAI Open-Source (Apache 2.0)
- `gpt-oss-120b` - 120B parameters, comparable to GPT-4 mini
- `gpt-oss-20b` - 20B parameters, runs on edge devices

### Meta Llama
- `@cf/meta/llama-3.3-70b-instruct` - Latest 70B model
- `@cf/meta/llama-3.1-8b-instruct` - Fast 8B model

### Mistral
- `@cf/mistral/mistral-7b-instruct-v0.2` - Efficient 7B model

## 🛠️ Troubleshooting

### React 19 Warnings
If you see peer dependency warnings about React 19, they're safe to ignore. CopilotEdge supports React 19.

### Environment Variables Not Working
Make sure your `.env.local` file is in the root directory and restart the dev server after changes.

### API Errors
Check the console for debug messages. Common issues:
- Invalid API token
- Account ID mismatch
- Rate limits exceeded

## 📖 Learn More

- Edgecraft connector (repo root)
- Cloudflare Workers AI: https://developers.cloudflare.com/workers-ai/

## 🚢 Deployment

### Deploy to Vercel (Recommended)
```bash
# Deploy with environment variables
vercel --env CLOUDFLARE_API_TOKEN=your-token --env CLOUDFLARE_ACCOUNT_ID=your-account-id
```

### Deploy to Cloudflare Pages
This starter targets Next.js (Vercel) for best streaming experience. If you deploy to Pages, use a compatible adapter or split the API route to a Worker.

### Environment Variables for Production
Set these in your deployment platform:
```
CLOUDFLARE_API_TOKEN=your-production-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
NODE_ENV=production
```

## 🧪 Testing Your Setup

1. **Check Environment**: The app automatically detects if your Cloudflare credentials are configured
2. **Test Chat**: Click the chat bubble and send a message
3. **Test Textarea**: Type in the textarea and press Cmd+K for AI suggestions
4. **Monitor Logs**: Check browser console for debug information in development mode

## 🔧 Advanced Configuration

- **Model fallback**: handler tries safe Cloudflare slugs; can fallback to OpenAI if configured.
- **Retry logic**: exponential backoff on transient failures.
- **Server-side logs**: provider error bodies are logged (dev) for debugging; clients receive safe messages (401/429/503).

### Security Best Practices
- Store API tokens in environment variables only
- Add rate limiting in production
- Enable server request logging/monitoring

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a pull request

## ❓ FAQ

**Q: Which model should I use?**
A: Start with `@cf/meta/llama-3.1-8b-instruct` (widely available). Use 70B for higher quality.

**Q: How do I reduce costs?**
A: Enable caching, use smaller models, and implement rate limiting.

**Q: Can I use custom domains?**
A: Yes, configure `CLOUDFLARE_GATEWAY_ID` for custom domain routing.

**Q: How do I monitor usage?**
A: Check Cloudflare Workers dashboard for request metrics and billing. In dev, the server logs provider error text safely.

## 📋 Changelog

### v0.1.0 (Latest)
- ✅ Interactive demo page with live examples
- ✅ Multiple AI model support with selector
- ✅ Environment configuration detection
- ✅ Enhanced error handling and debugging
- ✅ Comprehensive documentation
- ✅ Production-ready configuration

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ using CopilotEdge, CopilotKit, and Cloudflare Workers AI**
