import { ChatProvider } from '../components/ui/ChatProvider';
import ChatPopup from '../components/ui/ChatPopup';
import "./globals.css";

export const metadata = {
  title: 'CopilotEdge Starter',
  description: 'AI-powered Next.js app with CopilotEdge and Cloudflare Workers AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Use local CopilotKit-compatible shim (no cloud) */}
        <ChatProvider>
          {children}
          <ChatPopup />
        </ChatProvider>
      </body>
    </html>
  );
}
