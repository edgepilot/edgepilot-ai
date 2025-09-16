'use client';

import { useState } from 'react';

export default function HomePage() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message || { role: 'assistant', content: 'No response' };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-3xl font-bold mb-6">EdgePilot AI Chat</h1>

      <div className="space-y-4 mb-4">
        {messages.map((message, index) => (
          <div key={index} className={`p-3 rounded-lg ${
            message.role === 'user'
              ? 'bg-blue-100 ml-12'
              : 'bg-gray-100 mr-12'
          }`}>
            <div className="font-semibold capitalize mb-1">{message.role}</div>
            <div>{message.content}</div>
          </div>
        ))}
        {loading && (
          <div className="bg-gray-100 mr-12 p-3 rounded-lg">
            <div className="font-semibold mb-1">Assistant</div>
            <div>Thinking...</div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}