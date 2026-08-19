'use client';

import { useState } from 'react';

type Message = { role: 'user' | 'assistant'; text: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMessage = input;
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply ?? 'Erreur.' }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', text: "Erreur de connexion à l'agent." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Skincare &amp; Haircare Agent</h1>

      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <p style={styles.placeholder}>Décris ta peau, tes cheveux, ou colle une liste d&apos;ingrédients pour commencer.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ ...styles.row, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <span style={{ ...styles.bubble, ...(m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant) }}>
              {m.text}
            </span>
          </div>
        ))}
        {loading && <div style={styles.typing}>L&apos;agent réfléchit…</div>}
      </div>

      <div style={styles.inputRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Écris ton message…"
          style={styles.input}
        />
        <button onClick={sendMessage} disabled={loading} style={styles.button}>
          Envoyer
        </button>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' },
  title: { fontSize: 22, marginBottom: 16 },
  chatBox: {
    minHeight: 420,
    border: '1px solid #e2e2e2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  placeholder: { color: '#999', fontSize: 14 },
  row: { display: 'flex' },
  bubble: { display: 'inline-block', padding: '8px 14px', borderRadius: 14, maxWidth: '80%', fontSize: 15, lineHeight: 1.4 },
  bubbleUser: { background: '#111', color: '#fff' },
  bubbleAssistant: { background: '#f1f1f1', color: '#111' },
  typing: { color: '#999', fontSize: 13, fontStyle: 'italic' },
  inputRow: { display: 'flex', gap: 8 },
  input: { flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #ccc', fontSize: 15 },
  button: { padding: '10px 18px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', cursor: 'pointer' }
};
