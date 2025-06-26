import React from "react";
import { X, User, MapPin, Mail, FileText, DollarSign } from "lucide-react";
import "./InvoiceDetailModal.css";

export default function InvoiceDetailModal({ invoice, onClose }) {
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

  const getStatusClass = (status = "") => {
    switch (status.toLowerCase()) {
      case 'emailsent':
        return 'invoice-detail-badge sent';
      case 'needtoprint':
        return 'invoice-detail-badge pending';
      default:
        return 'invoice-detail-badge';
    }
  };

  const getStatusText = (status = "") => {
    switch (status.toLowerCase()) {
      case 'emailsent':
        return 'Email Sent';
      case 'needtoprint':
        return 'Need to Print';
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
  const invoiceId = invoice?.Id || 'Unknown';
  const billAddr = invoice?.BillAddr || null;
  const customerMemo = invoice?.CustomerMemo?.value || '';

  const lineItems = invoice?.Line?.filter(line => line?.Description) || [];
  const subtotal = lineItems.reduce((sum, item) => sum + (item?.Amount || 0), 0);
  const tax = invoice?.TxnTaxDetail?.TotalTax || 0;

  return (
    <div className="invoice-detail-modal-bg">
      <div className="invoice-detail-modal">
        {/* Header */}
        <div className="invoice-detail-header">
          <div className="invoice-detail-header-left">
            <div className="invoice-detail-logo">📧</div>
            <div>
              <h2 className="invoice-detail-title">Invoice #{docNumber}</h2>
              <p className="invoice-detail-desc">Invoice Details & Summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="invoice-detail-close"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="invoice-detail-content">
          <div className="invoice-detail-sections">
            {/* Status and Key Info */}
            <div className="invoice-detail-section">
              <div className="invoice-detail-section-title">
                <FileText size={20} /> Invoice Information
              </div>
              <div className="invoice-detail-info-list">
                <div className="invoice-detail-info-row">
                  <span>Status:</span>
                  <span className={getStatusClass(emailStatus)}>
                    {getStatusText(emailStatus)}
                  </span>
                </div>
                <div className="invoice-detail-info-row">
                  <span>Issue Date:</span>
                  <span>{formatDate(txnDate)}</span>
                </div>
                <div className="invoice-detail-info-row">
                  <span>Due Date:</span>
                  <span>{formatDate(dueDate)}</span>
                </div>
                <div className="invoice-detail-info-row">
                  <span>Invoice ID:</span>
                  <span className="mono">{invoiceId}</span>
                </div>
              </div>
            </div>
            <div className="invoice-detail-section">
              <div className="invoice-detail-section-title">
                <User size={20} /> Customer Details
              </div>
              <div className="invoice-detail-info-list">
                <div className="invoice-detail-info-row">
                  <User size={16} className="icon" />
                  <span>{customerName}</span>
                </div>
                {billAddr && (
                  <div className="invoice-detail-info-row">
                    <MapPin size={16} className="icon" />
                    <div className="address">
                      {billAddr.Line1 && <div>{billAddr.Line1}</div>}
                      {billAddr.Line2 && <div>{billAddr.Line2}</div>}
                      {billAddr.Line3 && <div>{billAddr.Line3}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Line Items */}
          <div className="invoice-detail-section">
            <div className="invoice-detail-section-title">
              <DollarSign size={20} /> Invoice Items
            </div>
            <div className="invoice-detail-items">
              {lineItems.length > 0 ? (
                lineItems.map((item, index) => (
                  <div key={index} className="invoice-detail-item-row">
                    <div className="item-main">
                      <h4>{item.Description}</h4>
                      {item.SalesItemLineDetail && (
                        <p>${(item.SalesItemLineDetail.UnitPrice || 0).toFixed(2)} × {item.SalesItemLineDetail.Qty || 1}</p>
                      )}
                    </div>
                    <span className="item-amount">${(item.Amount || 0).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="invoice-detail-item-row">
                  <div className="item-main">
                    <h4>No line items available</h4>
                  </div>
                </div>
              )}
            </div>
            <div className="invoice-detail-totals">
              <div className="row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="row">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              )}
              <div className="row total">
                <span>Total:</span>
                <span>${totalAmt.toFixed(2)}</span>
              </div>
              {balance > 0 && (
                <div className="row due">
                  <span>Amount Due:</span>
                  <span>${balance.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
          {/* Customer Message */}
          {customerMemo && (
            <div className="invoice-detail-section">
              <div className="invoice-detail-section-title">
                <Mail size={20} /> Message
              </div>
              <p className="invoice-detail-message">{customerMemo}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
