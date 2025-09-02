"use client";
import React, { useState } from 'react';

interface CodeExample {
  title: string;
  description: string;
  fileName?: string;
  code: string;
}

interface ConfigOption {
  name: string;
  description: string;
}

interface CodeExamplesProps {
  title?: string;
  subtitle?: string;
  examples: CodeExample[];
  configurationTitle?: string;
  configurationDescription?: string;
  handlerOptions?: ConfigOption[];
  availableModels?: ConfigOption[];
  nextStepsTitle?: string;
  nextStepsSubtitle?: string;
}

export function CodeExamples({ 
  title = "Implementation Guide",
  subtitle = "Copy these examples to build your own AI features",
  examples,
  configurationTitle = "4. Configuration Options",
  configurationDescription = "CopilotEdge supports many configuration options:",
  handlerOptions = [],
  availableModels = [],
  nextStepsTitle = "Ready to Build?",
  nextStepsSubtitle = "You now have everything you need to create AI-powered applications"
}: CodeExamplesProps) {
  const [copied, setCopied] = useState<number | null>(null);

  async function copy(code: string, idx: number) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(idx);
      window.setTimeout(() => setCopied((c) => (c === idx ? null : c)), 1200);
    } catch {}
  }

  return (
    <>
      <section id="code" className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center">{title}</h2>
          <p className="text-xl text-gray-400 text-center mb-12">{subtitle}</p>

          <div className="space-y-8">
            {examples.map((example, index) => (
              <div key={index}>
                <h3 className="text-2xl font-semibold mb-4">{example.title}</h3>
                <p className="text-gray-400 mb-4">{example.description}</p>
                <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                  {(example.fileName || true) && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        {example.fileName && (
                          <span className="ml-4 text-xs text-gray-500">{example.fileName}</span>
                        )}
                      </div>
                      <button
                        onClick={() => copy(example.code, index)}
                        className="text-xs px-2 py-1 rounded-md border border-gray-700 text-gray-300 hover:bg-white/5"
                        aria-label="Copy code"
                        title={copied === index ? 'Copied' : 'Copy code'}
                      >
                        {copied === index ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                  <pre className="p-6 text-sm overflow-x-auto">
                    <code className="text-gray-300">{example.code}</code>
                  </pre>
                </div>
              </div>
            ))}

            {/* Configuration Options */}
            {(handlerOptions.length > 0 || availableModels.length > 0) && (
              <div>
                <h3 className="text-2xl font-semibold mb-4">{configurationTitle}</h3>
                <p className="text-gray-400 mb-4">{configurationDescription}</p>
                <div className="grid md:grid-cols-2 gap-6">
                  {handlerOptions.length > 0 && (
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                      <h4 className="font-semibold mb-3">Handler Options</h4>
                      <ul className="space-y-2 text-sm text-gray-400">
                        {handlerOptions.map((option, i) => (
                          <li key={i}>
                            <code className="text-gray-300">{option.name}</code> - {option.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {availableModels.length > 0 && (
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                      <h4 className="font-semibold mb-3">Available Models</h4>
                      <ul className="space-y-2 text-sm text-gray-400">
                        {availableModels.map((model, i) => (
                          <li key={i}>
                            <code className="text-gray-300">{model.name}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">{nextStepsTitle}</h2>
          <p className="text-xl text-gray-400 mb-8">{nextStepsSubtitle}</p>
          <div className="flex items-center justify-center space-x-4">
            {/* Buttons can be added here via props if needed */}
          </div>
        </div>
      </section>
    </>
  );
}
