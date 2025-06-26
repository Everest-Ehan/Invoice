import React from "react";

export default function ChatPanel({ chat, input, setInput, loading, onSend }) {
  return (
    <div className="panel chat-panel">
      <div className="panel-header">
        <h2>AI Assistant 🤖</h2>
      </div>
      <div className="chat-area">
        {chat.length === 0 ? (
          <div className="empty">Start a conversation about your invoices!</div>
        ) : (
          chat.map((msg, idx) => (
            <div key={idx} className={`chat-msg ${msg.role}`}>
              {msg.content}
            </div>
          ))
        )}
        {loading && <div className="chat-msg assistant loading">Thinking...</div>}
      </div>
      <div className="chat-input-container">
        <form className="chat-input-row" onSubmit={onSend}>
          <textarea
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your invoices..."
            disabled={loading}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend(e);
              }
            }}
          />
          <button className="send-btn" type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
