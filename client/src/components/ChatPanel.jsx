import React from "react";
import { Send, Bot, User } from "lucide-react";

// Function to format AI response text
const formatAIResponse = (text) => {
  if (!text) return text;
  
  // Remove markdown formatting but preserve bold
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert bold to HTML
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic formatting
    .replace(/`(.*?)`/g, '$1')       // Remove code formatting
    .replace(/#{1,6}\s/g, '')        // Remove headers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Convert links to text
    .replace(/\n\n/g, '\n')          // Reduce multiple line breaks
    .trim();
  
  return formatted;
};

export default function ChatPanel({ chat, input, setInput, loading, onSend }) {
  return (
    <div className="panel chat-panel">
      <div className="panel-header">
        <h2>AI Assistant</h2>
      </div>
      
      <div className="chat-area">
        {chat.length === 0 ? (
          <div className="empty">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bot size={20} className="text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Welcome!</h3>
              <p className="text-sm text-gray-600 mb-3">Ask me anything about your invoices.</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>💡 Try: "Show me recent invoices"</p>
                <p>"What's the total outstanding amount?"</p>
              </div>
            </div>
          </div>
        ) : (
          chat.map((msg, idx) => (
            <div key={idx} className={`chat-msg ${msg.role}`}>
              {msg.role === 'assistant' ? (
                <div dangerouslySetInnerHTML={{ __html: formatAIResponse(msg.content) }} />
              ) : (
                msg.content
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="chat-msg assistant loading">
            <div className="flex items-center gap-2">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
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
          <button 
            className="send-btn" 
            type="submit" 
            disabled={loading || !input.trim()}
            title="Send message"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
