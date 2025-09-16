import "./globals.css";

export const metadata = {
  title: 'EdgePilot AI App',
  description: 'AI-powered Next.js app with EdgePilot and Cloudflare Workers AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}