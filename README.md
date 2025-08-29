# 🚀 CopilotEdge Starter App

A comprehensive Next.js starter application demonstrating how to build AI-powered applications using **CopilotEdge** with **CopilotKit** and **Cloudflare Workers AI**.

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
- **CopilotEdge Handler** (`app/api/copilotedge/route.ts`) - Pre-configured endpoint for AI requests

### Features Demonstrated
- ✅ CopilotKit integration with CopilotEdge
- ✅ Multiple AI models (OpenAI OSS, Llama, Mistral)
- ✅ Smart caching for cost reduction
- ✅ Rate limiting
- ✅ React 19 compatibility

## 🎯 How to Use

### 1. Chat Popup
Click the chat icon in the bottom-right corner to open the AI assistant.

### 2. AI-Enhanced Textarea
1. Click in the textarea
2. Start typing
3. Press **Cmd+K** (Mac) or **Ctrl+K** (Windows) to get AI suggestions

### 3. Switch Models
Use the dropdown in the header to switch between different AI models:
- **GPT-OSS-120B** - OpenAI's open-source model (best quality)
- **GPT-OSS-20B** - Smaller, faster version
- **Llama 3.3 70B** - Meta's latest model
- **Llama 3.1 8B** - Fast, lightweight option
- **Mistral 7B** - Quick responses

## 🔧 Configuration Options

Edit `app/api/copilotedge/route.ts` to customize:

```typescript
export const POST = createCopilotEdgeHandler({
  model: "gpt-oss-120b",     // Change default model
  debug: true,                // Enable/disable debug logs
  cache: {
    enabled: true,
    ttl: 60                   // Cache duration in seconds
  },
  rateLimit: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000           // Rate limit window
  }
});
```

## 📚 Available Models

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

- [CopilotEdge Documentation](https://github.com/Klammertime/copilotedge)
- [CopilotKit Documentation](https://docs.copilotkit.ai)
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)

## 🚢 Deployment

### Deploy to Vercel (Recommended)
```bash
# Deploy with environment variables
vercel --env CLOUDFLARE_API_TOKEN=your-token --env CLOUDFLARE_ACCOUNT_ID=your-account-id
```

### Deploy to Cloudflare Pages
```bash
# Build for static export
npm run build
npx wrangler pages publish out
```

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

### Custom Models
Edit `app/api/copilotedge/route.ts`:
```typescript
export const POST = createCopilotEdgeHandler({
  model: '@cf/meta/llama-3.3-70b-instruct', // Your preferred model
  fallback: '@cf/meta/llama-3.1-8b-instruct', // Fallback option
  // ... other config
});
```

### Performance Optimization
- **Caching**: Responses cached for 2 minutes by default
- **Rate Limiting**: 100 requests/minute per IP
- **Model Fallback**: Automatic fallback to smaller model if primary fails
- **Retry Logic**: Up to 5 retries with exponential backoff

### Security Best Practices
- Store API tokens in environment variables only
- Use rate limiting in production
- Enable request logging for monitoring
- Implement proper error handling

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a pull request

## ❓ FAQ

**Q: Which model should I use?**
A: Start with `@cf/meta/llama-3.1-70b-instruct` for best quality, or `@cf/meta/llama-3.1-8b-instruct` for speed.

**Q: How do I reduce costs?**
A: Enable caching, use smaller models, and implement rate limiting.

**Q: Can I use custom domains?**
A: Yes, configure `CLOUDFLARE_GATEWAY_ID` for custom domain routing.

**Q: How do I monitor usage?**
A: Check Cloudflare Workers dashboard for request metrics and billing.

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