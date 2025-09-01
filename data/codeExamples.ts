export interface CodeExample {
  title: string;
  description: string;
  fileName?: string;
  code: string;
}

export const codeExamples: CodeExample[] = [
  {
    title: "1. Create Your API Route",
    description: "Create app/api/ai/chat/route.ts:",
    fileName: "route.ts",
    code: `import { createNextHandler } from '@edgecraft/copilotkit-workers-ai/next';

export const runtime = 'edge';

export const POST = createNextHandler({
  apiKey: process.env.CLOUDFLARE_API_TOKEN,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  model: '@cf/meta/llama-3.1-70b-instruct',
  stream: true,
  cache: false,
  maxRetries: 2,
  debug: process.env.NODE_ENV !== 'production'
});`
  },
  {
    title: "2. Setup Your Layout",
    description: "Wrap your app with CopilotKit in app/layout.tsx:",
    fileName: "layout.tsx",
    code: `import { CopilotKit } from '@copilotkit/react-core';
import { CopilotPopup } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CopilotKit runtimeUrl="/api/ai/chat">
          {children}
          <CopilotPopup 
            instructions="You are a helpful AI assistant."
            defaultOpen={false}
            labels={{
              title: "AI Assistant",
              initial: "Hi! How can I help you today?"
            }}
          />
        </CopilotKit>
      </body>
    </html>
  );
}`
  },
  {
    title: "3. Use AI Components",
    description: "Add AI-powered features to your components:",
    fileName: "MyComponent.tsx",
    code: `import { CopilotTextarea } from '@copilotkit/react-textarea';
import { useCopilotAction } from '@copilotkit/react-core';

export function MyComponent() {
  const [text, setText] = useState('');

  // Register a custom action
  useCopilotAction({
    name: "generateIdeas",
    description: "Generate creative ideas",
    parameters: [
      {
        name: "topic",
        type: "string",
        description: "The topic to generate ideas for",
        required: true,
      }
    ],
    handler: async ({ topic }) => {
      // Your custom logic here
      return \`Generated ideas for: \${topic}\`;
    },
  });

  return (
    <CopilotTextarea
      value={text}
      onValueChange={setText}
      placeholder="Type here..."
      autosuggestionsConfig={{
        textareaPurpose: "Creative writing",
        chatApiConfigs: {
          suggestionsApiConfig: {
            model: "@cf/meta/llama-3.1-70b-instruct"
          }
        }
      }}
    />
  );
}`
  }
];

export interface ConfigOption {
  name: string;
  description: string;
}

export const handlerOptions: ConfigOption[] = [
  { name: 'apiKey', description: 'Cloudflare API token' },
  { name: 'accountId', description: 'Cloudflare account ID' },
  { name: 'model', description: 'AI model to use' },
  { name: 'stream', description: 'Enable streaming responses' },
  { name: 'cache', description: 'Enable in-memory cache' },
  { name: 'maxRetries', description: 'Retry count on failure' },
  { name: 'debug', description: 'Server-side debug logs' }
];
