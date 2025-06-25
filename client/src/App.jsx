import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/status')
      .then(res => res.json())
      .then(data => {
        setConnected(data.connected);
        if (data.connected) {
          fetch('http://localhost:5000/api/tokens')
            .then(res => res.json())
            .then(({ accessToken, realmId }) => {
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('realmId', realmId);
            });
        }
      });
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setChat((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const realmId = localStorage.getItem('realmId');

      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, accessToken, realmId }),
      });

      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      let aiMsg = '';
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = new TextDecoder().decode(value);
          chunk.split('\n\n').forEach((line) => {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.replace('data: ', ''));
                if (data.type === 'text') {
                  aiMsg += data.text;
                  setChat((prev) => {
                    if (prev.length && prev[prev.length - 1].role === 'assistant') {
                      return [...prev.slice(0, -1), { role: 'assistant', content: aiMsg }];
                    } else {
                      return [...prev, { role: 'assistant', content: aiMsg }];
                    }
                  });
                } else if (data.type === 'tool-result') {
                  if (data.result && Array.isArray(data.result.data)) {
                    setInvoices(data.result.data);
                  }
                }
              } catch (err) {
                // Ignore JSON parse errors for incomplete chunks
              }
            }
          });
        }
      }
    } catch (err) {
      setChat((prev) => [...prev, { role: 'assistant', content: 'Error: ' + err.message }]);
    }
    setLoading(false);
  };

  if (!connected) {
    return (
      <div className="connect-container">
        <h2>Connect to QuickBooks</h2>
        <a href="http://localhost:5000/api/auth/quickbooks">
          <button>Connect Now</button>
        </a>
      </div>
    );
  }

  return (
    <div className="dual-panel-container">
      <div className="panel invoice-panel">
        <h2>Invoices <span role="img" aria-label="invoice">🧾</span></h2>
        <div className="invoice-list">
          {invoices.length === 0 ? (
            <div className="empty">No invoices loaded yet.</div>
          ) : (
            invoices.map((inv, idx) => (
              <div className="invoice-card" key={inv.Id || idx}>{inv.DocNumber || JSON.stringify(inv)}</div>
            ))
          )}
        </div>
      </div>
      <div className="panel chat-panel">
        <h2>AI Assistant <span role="img" aria-label="robot">🤖</span></h2>
        <div className="chat-area">
          {chat.length === 0 ? (
            <div className="empty">Start a conversation about your invoices!</div>
          ) : (
            chat.map((msg, idx) => (
              <div key={idx} className={`chat-msg ${msg.role}`}>{msg.content}</div>
            ))
          )}
          {loading && <div className="chat-msg assistant">Thinking...</div>}
        </div>
        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your invoices..."
            disabled={loading}
          />
          <button className="send-btn" type="submit" disabled={loading}>Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;