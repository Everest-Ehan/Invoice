import React from "react";
import InvoiceCard from "./InvoiceCard";
export default function InvoicePanel({ invoices, onLogout }) {
  return (
    <div className="panel invoice-panel">
      <div className="panel-header">
        <h2>Invoices 🧾</h2>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>
      <div className="invoice-list">
        {invoices.length === 0 ? (
          <div className="empty">No invoices loaded yet.</div>
        ) : (
          invoices.map((inv, idx) => <InvoiceCard key={inv.Id || idx} invoice={inv} />)
        )}
      </div>
    </div>
  );
}
