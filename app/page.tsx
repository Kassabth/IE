'use client';

import { useState } from 'react';
import type { Bucket } from '../lib/types';
import { bucketLabel } from '../lib/safety';

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  bucket?: Bucket;
  crisis?: boolean;
  createdAt: string;
}

type ApiResponse = {
  bucket: Bucket;
  crisis: boolean;
  response: string;
};

export default function HomePage() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: UiMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const payload = {
        messages: [
          ...messages.map((m) => ({
            role: m.role,
            content: m.content
          })),
          { role: 'user' as const, content: trimmed }
        ]
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Request failed');
      }

      const data: ApiResponse = await res.json();

      const assistantMessage: UiMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        bucket: data.bucket,
        crisis: data.crisis,
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Give it a moment and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <main className="app-container" aria-label="AI Mirror emotional regulation assistant">
        <header className="app-header">
          <div className="app-title">AI Mirror</div>
          <p className="app-subtitle">
            A calm, firm mirror to slow down, name what&apos;s happening, and choose one grounded next step.
          </p>
          <p className="safety-note">
            <strong>Safety note:</strong> Not therapy. Not medical advice. If you are in crisis or feel unsafe, contact
            local emergency services or trusted real-world support.
          </p>
        </header>

        <section className="chat-area">
          {messages.length === 0 && (
            <div className="hint-text">
              You can start with something simple, like:
              <br />
              “I feel like checking my phone again.” / “I have too much to do and I&apos;m frozen.” / “I feel insecure
              about today.”
            </div>
          )}

          {messages.map((m) => (
            <article key={m.id} className={`message-row ${m.role === 'user' ? 'user' : 'assistant'}`}>
              <div className={`message-bubble ${m.role}`}>
                <div>{m.content}</div>
                {m.role === 'assistant' && (m.bucket || m.crisis) && (
                  <div className="meta-row">
                    {m.crisis ? (
                      <span className="bucket-pill">
                        <span>CRISIS SAFETY</span>
                      </span>
                    ) : m.bucket ? (
                      <span className="bucket-pill">
                        <span>{bucketLabel(m.bucket)}</span>
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <form className="input-panel" onSubmit={handleSubmit}>
          <label className="input-label" htmlFor="message">
            Describe what&apos;s happening in 1–3 sentences.
          </label>
          <div className="input-row">
            <textarea
              id="message"
              className="input-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: I keep feeling the urge to check my phone instead of working."
              disabled={loading}
            />
            <button type="submit" className="send-button" disabled={loading || !input.trim()}>
              {loading ? 'Reflecting…' : 'Send'}
            </button>
          </div>
          {error && <div className="error-text" role="status">{error}</div>}
          {!error && (
            <div className="hint-text">
              This tool helps with urge loops, mental overwhelm, and self‑doubt. Keep it concrete and specific.
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

