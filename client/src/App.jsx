import React, { useState, useEffect } from "react";
import InvoicePanel from "./components/InvoicePanel";
import ChatPanel from "./components/ChatPanel";
import ConnectPanel from "./components/ConnectPanel";
import Loader from "./components/Loader";
import "./App.css";

function App() {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check QuickBooks connection and token validity on load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Handle tokens from URL parameters (after OAuth redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokensParam = urlParams.get("tokens");
    
    if (tokensParam) {
      try {
        const tokens = JSON.parse(decodeURIComponent(tokensParam));
        
        // Save to localStorage
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("realmId", tokens.realmId);
        localStorage.setItem("qb_accessToken", tokens.accessToken);
        localStorage.setItem("qb_refreshToken", tokens.refreshToken);
        localStorage.setItem("qb_realmId", tokens.realmId);
        localStorage.setItem("qb_expiresAt", tokens.expiresAt.toString());
        
        // Sync with backend
        syncTokensWithBackend(tokens);
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Recheck auth status
        checkAuthStatus();
      } catch (error) {
        console.error("Error parsing tokens from URL:", error);
      }
    }
  }, []);

  const syncTokensWithBackend = async (tokens) => {
    try {
      await fetch("http://localhost:5000/api/auth/sync-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokens),
      });
    } catch (error) {
      console.error("Failed to sync tokens with backend:", error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      // First check if we have tokens in localStorage
      const accessToken = localStorage.getItem("qb_accessToken");
      const realmId = localStorage.getItem("qb_realmId");
      
      if (accessToken && realmId) {
        // Sync tokens with backend
        const tokens = {
          accessToken,
          refreshToken: localStorage.getItem("qb_refreshToken"),
          realmId,
          expiresAt: localStorage.getItem("qb_expiresAt")
        };
        await syncTokensWithBackend(tokens);
      }

      const response = await fetch("http://localhost:5000/api/auth/validate-token");
      const data = await response.json();
      
      if (data.valid) {
        setConnected(true);
        // Ensure tokens are in the expected format
        const qbAccessToken = localStorage.getItem("qb_accessToken");
        const qbRealmId = localStorage.getItem("qb_realmId");
        if (qbAccessToken && qbRealmId) {
          localStorage.setItem("accessToken", qbAccessToken);
          localStorage.setItem("realmId", qbRealmId);
        }
      } else {
        if (data.needsRefresh && data.hasRefreshToken) {
          // Try to refresh the token
          console.log("Token expired, attempting refresh...");
          try {
            const refreshResponse = await fetch("http://localhost:5000/api/auth/refresh-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" }
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              
              // Update localStorage with new tokens
              localStorage.setItem("qb_accessToken", refreshData.accessToken);
              localStorage.setItem("accessToken", refreshData.accessToken);
              localStorage.setItem("qb_expiresAt", refreshData.expiresAt.toString());
              
              setConnected(true);
              console.log("Token refreshed successfully");
            } else {
              throw new Error("Token refresh failed");
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            setConnected(false);
            // Clear invalid tokens
            localStorage.removeItem("accessToken");
            localStorage.removeItem("realmId");
            localStorage.removeItem("qb_accessToken");
            localStorage.removeItem("qb_refreshToken");
            localStorage.removeItem("qb_realmId");
            localStorage.removeItem("qb_expiresAt");
          }
        } else {
          setConnected(false);
          if (data.needsAuth) {
            console.log("No tokens found, need to authenticate");
          } else if (data.needsRefresh) {
            console.log("Token expired, need to refresh or re-authenticate");
          }
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setConnected(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout");
      setConnected(false);
      setChat([]);
      setInvoices([]);
      // Clear local storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("realmId");
      localStorage.removeItem("qb_accessToken");
      localStorage.removeItem("qb_refreshToken");
      localStorage.removeItem("qb_realmId");
      localStorage.removeItem("qb_expiresAt");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setChat((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Get tokens from localStorage
      const accessToken = localStorage.getItem("qb_accessToken");
      const refreshToken = localStorage.getItem("qb_refreshToken");
      const realmId = localStorage.getItem("qb_realmId");

      if (!accessToken || !realmId) {
        throw new Error("No valid tokens found. Please reconnect to QuickBooks.");
      }

      const response = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input,
          accessToken,
          refreshToken,
          realmId
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be invalid, check auth status
          await checkAuthStatus();
          throw new Error("Authentication failed. Please reconnect to QuickBooks.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('🤖 AI Response:', {
        text: data.text,
        hasInvoices: data.hasInvoices,
        invoiceCount: data.invoices?.length || 0,
        toolResultsCount: data.toolResults?.length || 0
      });
      
      // Add AI response to chat
      setChat((prev) => [...prev, { role: "assistant", content: data.text }]);

      // Update invoices (always set, even if empty)
      if (Array.isArray(data.invoices)) {
        setInvoices(data.invoices);
        if (data.invoices.length > 0) {
          console.log(`📄 Loaded ${data.invoices.length} invoice(s) from AI response`);
        }
      } else {
        setInvoices([]);
      }

      // Log tool results for debugging
      if (data.toolResults && data.toolResults.length > 0) {
        console.log("🔧 Tool results:", data.toolResults.map((tr) => ({
          toolName: tr.toolName,
          status: tr.result?.status
        })));
      }

    } catch (err) {
      console.error("Chat error:", err);
      setChat((prev) => [...prev, { role: "assistant", content: "Error: " + err.message }]);
    }

    setLoading(false);
  };

  if (checkingAuth) return <Loader message="Checking QuickBooks Connection..." />;
  if (!connected) return <ConnectPanel />;

  return (
    <div className="dual-panel-container">
      <InvoicePanel invoices={invoices} onLogout={handleLogout} />
      <ChatPanel 
        chat={chat} 
        input={input} 
        setInput={setInput} 
        loading={loading} 
        onSend={handleSend} 
      />
    </div>
  );
}

export default App;
