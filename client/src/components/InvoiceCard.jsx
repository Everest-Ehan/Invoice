import React from "react";

function statusColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'paid': return '#22c55e';
    case 'voided': return '#f87171';
    case 'open': return '#facc15';
    default: return '#a1a1aa';
  }
}

export default function InvoiceCard({ invoice }) {
  // Extract essential fields with defensive checks
  const docNumber = invoice.DocNumber || (invoice.Id ? `Invoice #${invoice.Id}` : 'Unknown Invoice');
  const totalAmt = typeof invoice.TotalAmt === 'number' ? invoice.TotalAmt.toFixed(2) : 'N/A';
  const balance = typeof invoice.Balance === 'number' ? invoice.Balance.toFixed(2) : '0.00';
  const txnDate = invoice.TxnDate || 'No date';
  const dueDate = invoice.DueDate || 'No due date';
  const customerName = invoice.Customer?.name || invoice.Customer?.value || 'Unknown Customer';
  const note = invoice.PrivateNote;
  const invoiceLink = invoice.InvoiceLink;
  
  // Determine status
  let status = 'Open';
  if (balance === 0 || balance === '0.00') {
    status = 'Paid';
  } else if (note && note.toLowerCase().includes('void')) {
    status = 'Voided';
  }

  // Extract line items (excluding tax lines)
  const lineItems = invoice.Line ? invoice.Line.filter(line => 
    line.SalesItemLineDetail && !line.SalesItemLineDetail.ItemRef?.name?.toLowerCase().includes('tax')
  ) : [];

  return (
    <div className="invoice-card" tabIndex={0} style={{ outline: 'none' }}>
      {/* Header with Invoice Number and Status */}
      <div className="invoice-header-row">
        <div className="invoice-number">{docNumber}</div>
        <span 
          className="invoice-status-tag" 
          style={{ 
            background: statusColor(status), 
            color: '#fff', 
            borderRadius: 8, 
            padding: '4px 12px', 
            fontSize: 12, 
            fontWeight: '600',
            marginLeft: 8 
          }}
        >
          {status}
        </span>
      </div>

      {/* Customer and Dates */}
      <div className="invoice-customer">{customerName}</div>
      <div className="invoice-dates">
        <span>Date: {txnDate}</span>
        {dueDate !== 'No due date' && <span>Due: {dueDate}</span>}
      </div>

      {/* Amount Information */}
      <div className="invoice-amounts">
        <div className="invoice-total">Total: ${totalAmt}</div>
        {status === 'Open' && balance !== totalAmt && (
          <div className="invoice-balance">Balance: ${balance}</div>
        )}
      </div>

      {/* Line Items */}
      {lineItems.length > 0 && (
        <div className="invoice-line-items">
          <div className="line-items-header">Items:</div>
          {lineItems.slice(0, 3).map((line, idx) => (
            <div key={idx} className="line-item">
              <span className="line-description">
                {line.SalesItemLineDetail?.ItemRef?.name || line.Description || 'Unknown Item'}
              </span>
              <span className="line-amount">
                ${line.Amount ? parseFloat(line.Amount).toFixed(2) : '0.00'}
              </span>
            </div>
          ))}
          {lineItems.length > 3 && (
            <div className="line-item-more">+{lineItems.length - 3} more items</div>
          )}
        </div>
      )}

      {/* Note if present */}
      {note && <div className="invoice-note">Note: {note}</div>}

      {/* Invoice Link */}
      {invoiceLink && (
        <div className="invoice-link">
          <a href={invoiceLink} target="_blank" rel="noopener noreferrer" className="view-invoice-btn">
            View Invoice
          </a>
        </div>
      )}
    </div>
  );
}
