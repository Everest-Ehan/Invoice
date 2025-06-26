import React from "react";
import { apiUrl } from "../utils/api";

export default function ConnectPanel() {
  const handleConnect = () => {
    window.location.href = `${apiUrl}/api/auth/quickbooks`;
  };

  return (
    <div className="connect-container">
      <h2>QuickBooks Invoice Assistant</h2>
      <button className="connect-btn" onClick={handleConnect}>
        Connect to QuickBooks
      </button>
    </div>
  );
}
