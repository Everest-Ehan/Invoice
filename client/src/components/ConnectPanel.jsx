import React from "react";
import { apiUrl } from "../utils/api";

export default function ConnectPanel() {
  return (
    <div className="connect-container">
      <h2>Connect to QuickBooks</h2>
      <a href={`${apiUrl}/api/auth/quickbooks`}>
        <button className="connect-btn">Connect Now</button>
      </a>
    </div>
  );
}
