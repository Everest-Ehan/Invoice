import React from "react";
import { Calendar, User, DollarSign, Clock } from "lucide-react";
import "./InvoiceCard.css";

export function InvoiceCard({ invoice, onClick }) {
  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    try {
      // For date-only strings (YYYY-MM-DD), parse manually to avoid timezone issues
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[month - 1]} ${day}, ${year}`;
      } else {
        // For other date formats, parse as-is
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'emailsent':
        return 'invoice-badge sent';
      case 'needtoprint':
        return 'invoice-badge pending';
      default:
        return 'invoice-badge';
    }
  };

  const getStatusText = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'emailsent':
        return 'Sent';
      case 'needtoprint':
        return 'Pending';
      default:
        return status || 'Unknown';
    }
  };

  // Safe access to invoice properties with fallbacks
  const docNumber = invoice?.DocNumber || invoice?.Id || 'Unknown';
  const customerName = invoice?.CustomerRef?.name || 'Unknown Customer';
  const totalAmt = typeof invoice?.TotalAmt === 'number' ? invoice.TotalAmt : 0;
  const balance = typeof invoice?.Balance === 'number' ? invoice.Balance : 0;
  const txnDate = invoice?.TxnDate || '';
  const dueDate = invoice?.DueDate || '';
  const emailStatus = invoice?.EmailStatus || '';

  const isPastDue = dueDate && new Date(dueDate) < new Date() && balance > 0;

  return (
    <div onClick={onClick} className="invoice-card">
      <div className="invoice-card-main">
        <div className="invoice-card-header">
          <span className="text-lg font-semibold text-gray-900">#{docNumber}</span>
          <span className={getStatusClass(emailStatus)}>
            {getStatusText(emailStatus)}
          </span>
          {isPastDue && (
            <span className="invoice-badge overdue">Overdue</span>
          )}
        </div>
        <div className="invoice-card-grid">
          <div className="invoice-card-info">
            <User size={16} className="icon" />
            <span className="truncate">{customerName}</span>
          </div>
          <div className="invoice-card-info">
            <Calendar size={16} className="icon" />
            <span>Issued {formatDate(txnDate)}</span>
          </div>
          <div className="invoice-card-info">
            <Clock size={16} className="icon" />
            <span className={isPastDue ? 'due' : ''}>
              Due {formatDate(dueDate)}
            </span>
          </div>
          <div className="invoice-card-amount">
            <div className="invoice-card-info">
              <DollarSign size={16} className="icon" />
              <span className="total">${totalAmt.toFixed(2)}</span>
            </div>
            {balance > 0 && (
              <span className="due">${balance.toFixed(2)} due</span>
            )}
          </div>
        </div>
      </div>
      <div className="invoice-card-arrow">
        <span>📄</span>
      </div>
    </div>
  );
}
