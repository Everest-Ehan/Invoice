import React from "react";
export default function ConnectPanel() {
  return (
    <div className="connect-container">
      <h2>Connect to QuickBooks</h2>
      <a href="http://localhost:5000/api/auth/quickbooks">
        <button className="connect-btn">Connect Now</button>
      </a>
    </div>
  );
}
