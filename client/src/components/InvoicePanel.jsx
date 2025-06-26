import React, { useState } from "react";
import { InvoiceCard } from "./InvoiceCard";
import InvoiceDetailModal from "./InvoiceDetailModal";
import { LogOut, FileText, DollarSign, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import "./InvoicePanel.css";

export default function InvoicePanel({ invoices, onLogout }) {
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 5;

  // Safe calculations with null checks
  const totalAmount = invoices.reduce((sum, inv) => sum + (typeof inv?.TotalAmt === 'number' ? inv.TotalAmt : 0), 0);
  const outstandingAmount = invoices.reduce((sum, inv) => sum + (typeof inv?.Balance === 'number' ? inv.Balance : 0), 0);

  // Pagination calculations
  const totalPages = Math.ceil(invoices.length / invoicesPerPage);
  const startIndex = (currentPage - 1) * invoicesPerPage;
  const endIndex = startIndex + invoicesPerPage;
  const currentInvoices = invoices.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Generate page numbers for pagination UI
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="invoice-panel-bg">
      <div className="invoice-panel-container">
        {/* Header */}
        <div className="invoice-panel-header">
          <div className="invoice-panel-header-left">
            <div className="invoice-panel-logo">📧</div>
            <div>
              <h1 className="invoice-panel-title">Invoices</h1>
              <p className="invoice-panel-desc">Manage your billing and payments</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="invoice-panel-logout"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="invoice-panel-stats">
          <div className="invoice-panel-stat-card">
            <div className="invoice-panel-stat-content">
              <div>
                <p className="invoice-panel-stat-label">Total Invoices</p>
                <p className="invoice-panel-stat-value">{invoices.length}</p>
              </div>
              <div className="invoice-panel-stat-icon blue">📄</div>
            </div>
          </div>
          <div className="invoice-panel-stat-card">
            <div className="invoice-panel-stat-content">
              <div>
                <p className="invoice-panel-stat-label">Total Amount</p>
                <p className="invoice-panel-stat-value">
                  ${totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="invoice-panel-stat-icon green">💰</div>
            </div>
          </div>
          <div className="invoice-panel-stat-card">
            <div className="invoice-panel-stat-content">
              <div>
                <p className="invoice-panel-stat-label">Outstanding</p>
                <p className="invoice-panel-stat-value">
                  ${outstandingAmount.toFixed(2)}
                </p>
              </div>
              <div className="invoice-panel-stat-icon orange">⏰</div>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="invoice-panel-list">
          <div className="invoice-panel-list-header">
            <h2>Recent Invoices</h2>
            {invoices.length > 0 && (
              <div className="invoice-panel-pagination-info">
                <span className="pagination-text">
                  Showing {startIndex + 1}-{Math.min(endIndex, invoices.length)} of {invoices.length}
                </span>
                {totalPages > 1 && (
                  <div className="pagination-controls">
                    <button 
                      className="pagination-btn circle"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      <span role="img" aria-label="Previous">‹</span>
                    </button>
                    {getPageNumbers().map((num, idx) =>
                      num === '...'
                        ? <span key={idx} className="pagination-ellipsis">…</span>
                        : <button
                            key={num}
                            className={`pagination-btn circle${currentPage === num ? ' active' : ''}`}
                            onClick={() => goToPage(num)}
                            aria-current={currentPage === num ? 'page' : undefined}
                          >
                            {num}
                          </button>
                    )}
                    <button 
                      className="pagination-btn circle"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                    >
                      <span role="img" aria-label="Next">›</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {invoices.length === 0 ? (
            <div className="invoice-panel-empty">
              <div className="invoice-panel-empty-icon">📋</div>
              <h3>No invoices yet</h3>
              <p>Your invoices will appear here once they're created.</p>
            </div>
          ) : (
            <div>
              {currentInvoices.map((invoice, idx) => (
                <InvoiceCard
                  key={invoice?.Id || idx}
                  invoice={invoice}
                  onClick={() => setSelected(invoice)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selected && (
          <InvoiceDetailModal
            invoice={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}
