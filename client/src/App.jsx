import React, { useState, useEffect } from "react";
import { apiUrl } from "./utils/api";
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
        
        // Recheck auth status
        checkAuthStatus();
      } catch (error) {
        console.error("Error parsing tokens from URL:", error);
      }
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Get tokens from localStorage
      const accessToken = localStorage.getItem("qb_accessToken");
      const refreshToken = localStorage.getItem("qb_refreshToken");
      const realmId = localStorage.getItem("qb_realmId");
      const expiresAt = localStorage.getItem("qb_expiresAt");

      if (!accessToken || !realmId) {
        setConnected(false);
        setCheckingAuth(false);
        return;
      }

      const response = await fetch(`${apiUrl}/api/auth/validate-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, refreshToken, realmId, expiresAt })
      });
      const data = await response.json();

      if (data.valid) {
        setConnected(true);
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("realmId", realmId);
      } else {
        if (data.needsRefresh && data.hasRefreshToken) {
          // Try to refresh the token
          try {
            const refreshResponse = await fetch(`${apiUrl}/api/auth/refresh-token`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken, realmId })
            });
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              // Update localStorage with new tokens
              localStorage.setItem("qb_accessToken", refreshData.accessToken);
              localStorage.setItem("accessToken", refreshData.accessToken);
              localStorage.setItem("qb_refreshToken", refreshData.refreshToken);
              localStorage.setItem("qb_realmId", refreshData.realmId);
              localStorage.setItem("realmId", refreshData.realmId);
              localStorage.setItem("qb_expiresAt", refreshData.expiresAt.toString());
              setConnected(true);
            } else {
              throw new Error("Token refresh failed");
            }
          } catch (refreshError) {
            setConnected(false);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("realmId");
            localStorage.removeItem("qb_accessToken");
            localStorage.removeItem("qb_refreshToken");
            localStorage.removeItem("qb_realmId");
            localStorage.removeItem("qb_expiresAt");
          }
        } else {
          setConnected(false);
        }
      }
    } catch (error) {
      setConnected(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`);
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
      const response = await fetch(`${apiUrl}/api/ai/chat`, {
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
          await checkAuthStatus();
          throw new Error("Authentication failed. Please reconnect to QuickBooks.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setChat((prev) => [...prev, { role: "assistant", content: data.text }]);
      if (Array.isArray(data.invoices)) {
        setInvoices(data.invoices);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      setChat((prev) => [...prev, { role: "assistant", content: error.message }]);
    } finally {
      setLoading(false);
    }
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
