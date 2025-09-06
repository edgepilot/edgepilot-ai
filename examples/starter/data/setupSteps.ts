export interface SetupStep {
  title: string;
  description: string;
  instructions?: string[];
  code?: string;
  buttonText: string;
}

export const setupSteps: SetupStep[] = [
  {
    title: "Get Your Cloudflare Credentials",
    description: "You'll need a Cloudflare API token and Account ID to use Workers AI with the EdgePilot connector.",
    instructions: [
      'Go to <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">Cloudflare Dashboard</a>',
      'Create a new API token with "Workers AI" permissions',
      'Copy your Account ID from the dashboard sidebar'
    ],
    buttonText: "I have my credentials"
  },
  {
    title: "Add Environment Variables",
    description: "Create a `.env.local` file in your project root. OpenAI fallback is optional.",
    code: `# Required for Cloudflare
CLOUDFLARE_API_TOKEN=your-api-token-here
CLOUDFLARE_ACCOUNT_ID=your-account-id-here

# Optional: OpenAI fallback or default provider
# EDGEPILOT_PROVIDER=cloudflare   # or 'openai'
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini`,
    buttonText: "I've added the variables"
  },
  {
    title: "Test Your Setup",
    description: "Restart the dev server. In the popup header you can switch provider (Cloudflare/OpenAI). The app uses the EdgePilot API at `/api/ai/chat`.",
    code: `# Restart your dev server
npm run dev
# or
pnpm dev`,
    buttonText: "Check Configuration"
  }
];
