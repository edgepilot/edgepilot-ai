import { CopilotKit } from '@copilotkit/react-core';
import { CopilotPopup } from '@copilotkit/react-ui';
import "@copilotkit/react-ui/styles.css";
import "./globals.css";

export const metadata = {
  title: 'CopilotEdge Starter',
  description: 'AI-powered Next.js app with CopilotEdge and Cloudflare Workers AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <CopilotKit runtimeUrl="/api/ai/chat">
          {children}
          
          <CopilotPopup 
            instructions={`You are a helpful AI assistant powered by Edgecraft (CopilotKit + Cloudflare Workers AI).

You can help users with:
- Writing and editing content
- Code explanations and debugging
- General questions and research
- Creative tasks and brainstorming

Be concise, helpful, and friendly. When discussing technical topics, provide clear explanations with examples when appropriate.`}
            defaultOpen={false}
            labels={{
              title: "🤖 Edgecraft Assistant",
              initial: "Hi! I'm powered by Edgecraft (CopilotKit + Cloudflare Workers AI). How can I help you today?",
              placeholder: "Ask me anything...",
            }}
          />
        </CopilotKit>
      </body>
    </html>
  );
}
