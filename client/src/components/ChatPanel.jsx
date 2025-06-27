import React, { useEffect, useRef } from "react";   
import { Send, Bot, User } from "lucide-react";
import "./ChatPanel.css";

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
  const chatAreaRef = useRef(null);

  // Scroll to bottom when chat or loading changes
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [chat, loading]);

  return (
    <div className="panel chat-panel-ui">
      <div className="chat-header-ui">
        <span className="chat-header-bot"><Bot size={20} /></span>
        <span className="chat-header-title">AI Assistant</span>
      </div>
      <div className="chat-area-ui" ref={chatAreaRef}>
        {chat.length === 0 ? (
          <div className="chat-empty-ui">
            <div className="chat-empty-icon-ui">
              <Bot size={28} />
            </div>
            <div className="chat-empty-title-ui">Welcome!</div>
            <div className="chat-empty-desc-ui">Ask me anything about your invoices.</div>
            <div className="chat-empty-suggestions-ui">
              <span>💡 Try:</span> "Show me recent invoices"<br />"What's the total outstanding amount?"
            </div>
          </div>
        ) : (
          <div className="chat-msg-list-ui">
            {chat.map((msg, idx) => (
              <div key={idx} className={`chat-msg-ui${msg.role === 'user' ? ' user' : ''}`}>
                <span className="chat-msg-avatar-ui">
                  {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                </span>
                <span className="chat-msg-bubble-ui">
                  {msg.role === 'assistant' ? (
                    <span dangerouslySetInnerHTML={{ __html: formatAIResponse(msg.content) }} />
                  ) : (
                    msg.content
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
        {loading && (
          <div className="chat-msg-ui assistant loading">
            <span className="chat-msg-avatar-ui"><Bot size={18} /></span>
            <span className="chat-msg-bubble-ui">
              <span className="typing-indicator-ui">
                <span></span>
                <span></span>
                <span></span>
              </span>
              <span className="chat-msg-loading-text-ui">Thinking...</span>
            </span>
          </div>
        )}
      </div>
      <div className="chat-input-container-ui">
        <form className="chat-input-row-ui" onSubmit={onSend}>
          <textarea
            className="chat-input-ui"
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
            className="send-btn-ui" 
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
