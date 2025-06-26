import { z } from 'zod';
import { tool } from 'ai';
import QuickBooks from 'node-quickbooks';
import axios from 'axios';

function getQboClientOrError(tokens) {
  if (!tokens.accessToken || !tokens.realmId) {
    throw new Error('No valid tokens available. Please complete OAuth flow first.');
  }
  return new QuickBooks(
    process.env.QB_CLIENT_ID,
    process.env.QB_CLIENT_SECRET,
    tokens.accessToken,
    tokens.refreshToken,
    tokens.realmId,
    process.env.NODE_ENV !== 'production',
    false,
    null,
    '2.0',
    null
  );
}

export const invoiceTools = {
  getInvoice: tool({
    description: 'Get details of a specific invoice by ID',
    parameters: z.object({
      invoiceId: z.string().describe('The ID of the invoice to retrieve'),
    }),
    execute: async (params, toolContext) => {
      const qbo = getQboClientOrError(toolContext);
      return new Promise((resolve) => {
        qbo.getInvoice(params.invoiceId, (err, invoice) => {
          if (err) return resolve({ error: true, message: err.message || String(err) });
          if (!invoice || !invoice.Id) {
            return resolve({ error: true, message: 'Invoice does not exist' });
          }
          resolve(invoice);
        });
      });
    },
  }),

  listInvoices: tool({
    description: 'List invoices with optional filtering',
    parameters: z.object({
      maxResults: z.number().optional().describe('Maximum number of results to return (default: 10, max: 1000)'),
      startPosition: z.number().optional().describe('Starting position for pagination (default: 1)'),
      customerId: z.string().optional().describe('Filter by customer ID'),
      customerName: z.string().optional().describe('Filter by customer name (partial match)'),
      status: z.enum(['All', 'Pending', 'Approved', 'Closed', 'Voided']).optional().describe('Filter by invoice status'),
      dateFrom: z.string().optional().describe('Filter invoices from this date (YYYY-MM-DD)'),
      dateTo: z.string().optional().describe('Filter invoices to this date (YYYY-MM-DD)'),
      dueDateFrom: z.string().optional().describe('Filter by due date from (YYYY-MM-DD)'),
      dueDateTo: z.string().optional().describe('Filter by due date to (YYYY-MM-DD)'),
      totalFrom: z.number().optional().describe('Filter by minimum total amount'),
      totalTo: z.number().optional().describe('Filter by maximum total amount'),
      docNumber: z.string().optional().describe('Filter by document number (partial match)'),
      balanceFrom: z.number().optional().describe('Filter by minimum balance amount'),
      balanceTo: z.number().optional().describe('Filter by maximum balance amount'),
    }),
    execute: async (params, toolContext) => {
      const qbo = getQboClientOrError(toolContext);
      const baseUrl = 'https://sandbox-quickbooks.api.intuit.com';
      let queryString = 'SELECT * FROM Invoice';
      const conditions = [];
      if (params.customerId) conditions.push(`CustomerRef = '${params.customerId}'`);
      if (params.status && params.status !== 'All') conditions.push(`PrivateNote = '${params.status}'`);
      if (params.dateFrom) conditions.push(`TxnDate >= '${params.dateFrom}'`);
      if (params.dateTo) conditions.push(`TxnDate <= '${params.dateTo}'`);
      if (params.dueDateFrom) conditions.push(`DueDate >= '${params.dueDateFrom}'`);
      if (params.dueDateTo) conditions.push(`DueDate <= '${params.dueDateTo}'`);
      if (params.totalFrom !== undefined) conditions.push(`TotalAmt >= '${params.totalFrom}'`);
      if (params.totalTo !== undefined) conditions.push(`TotalAmt <= '${params.totalTo}'`);
      if (params.docNumber) conditions.push(`DocNumber LIKE '%${params.docNumber.replace(/'/g, "''")}%'`);
      if (params.balanceFrom !== undefined) conditions.push(`Balance >= '${params.balanceFrom}'`);
      if (params.balanceTo !== undefined) conditions.push(`Balance <= '${params.balanceTo}'`);
      if (conditions.length > 0) {
        queryString += ' WHERE ' + conditions.join(' AND ');
      }
      queryString += ' ORDER BY TxnDate DESC';
      if (params.maxResults) {
        queryString += ` MAXRESULTS ${Math.min(params.maxResults, 1000)}`;
      }
      try {
        const response = await axios.get(`${baseUrl}/v3/company/${toolContext.realmId}/query`, {
          params: {
            query: queryString,
            startposition: params.startPosition
          },
          headers: {
            Authorization: `Bearer ${toolContext.accessToken}`,
            Accept: 'application/json'
          }
        });
        const data = response.data;
        const invoiceList = data.QueryResponse?.Invoice || [];
        const totalCount = data.QueryResponse?.totalCount || 0;
        return {
          invoices: invoiceList,
          totalCount,
          startPosition: params.startPosition,
          maxResults: Math.min(params.maxResults, 1000),
          query: queryString,
          filters: {
            customerId: params.customerId,
            customerName: params.customerName,
            status: params.status,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            dueDateFrom: params.dueDateFrom,
            dueDateTo: params.dueDateTo,
            totalFrom: params.totalFrom,
            totalTo: params.totalTo,
            docNumber: params.docNumber,
            balanceFrom: params.balanceFrom,
            balanceTo: params.balanceTo
          }
        };
      } catch (err) {
        return { error: true, message: 'Failed to fetch invoices: ' + (err.response && err.response.data ? JSON.stringify(err.response.data) : err.message) };
      }
    },
  }),

  createInvoice: tool({
    description: 'Create a new QuickBooks invoice. REQUIRED: CustomerRef.value (Customer ID) and at least one Line item. Line items must include DetailType, Amount, and ItemRef.',
    parameters: z.object({
      invoice: z.object({
        CustomerRef: z.object({
          value: z.string().describe('Customer ID (required)'),
          name: z.string().optional().describe('Customer Display Name')
        }).describe('Customer reference (required)'),
        Line: z.array(z.object({
          DetailType: z.string().describe('Line item type (e.g., "SalesItemLineDetail")'),
          Amount: z.number().describe('Line item amount (required)'),
          SalesItemLineDetail: z.object({
            ItemRef: z.object({
              value: z.string().describe('Item ID (required)'),
              name: z.string().optional().describe('Item Name')
            })
          }).optional()
        })).min(1).describe('At least one line item is required'),
        DocNumber: z.string().optional().describe('Invoice document number'),
        TxnDate: z.string().optional().describe('Transaction date (YYYY-MM-DD)'),
        DueDate: z.string().optional().describe('Due date (YYYY-MM-DD)'),
        PrivateNote: z.string().optional().describe('Private note for the invoice'),
        Memo: z.string().optional().describe('Public memo for the invoice')
      }).describe('Invoice object with required CustomerRef and Line fields')
    }),
    execute: async (params, toolContext) => {
      const qbo = getQboClientOrError(toolContext);
      // Validate required fields
      if (!params.invoice.CustomerRef?.value) {
        return { error: true, message: 'CustomerRef.value is required' };
      }
      if (!params.invoice.Line || params.invoice.Line.length === 0) {
        return { error: true, message: 'At least one Line item is required' };
      }
      // Validate each line item
      for (let i = 0; i < params.invoice.Line.length; i++) {
        const line = params.invoice.Line[i];
        if (!line.DetailType) {
          return { error: true, message: `Line ${i + 1}: DetailType is required` };
        }
        if (typeof line.Amount !== 'number') {
          return { error: true, message: `Line ${i + 1}: Amount must be a number` };
        }
        if (line.DetailType === 'SalesItemLineDetail' && (!line.SalesItemLineDetail?.ItemRef?.value)) {
          return { error: true, message: `Line ${i + 1}: ItemRef.value is required for SalesItemLineDetail` };
        }
      }
      return new Promise((resolve) => {
        qbo.createInvoice(params.invoice, (err, createdInvoice) => {
          if (err) return resolve({ error: true, message: 'Failed to create invoice: ' + err.message });
          resolve(createdInvoice);
        });
      });
    },
  }),

  updateInvoice: tool({
    description: 'Update an existing QuickBooks invoice. REQUIRED: Id and SyncToken (must be current). Always fetch the latest invoice first using getInvoice, extract Id and SyncToken, and include them in the update. Only modify the fields that need changes, but always include Id, SyncToken, and any required fields like CustomerRef or Line. If updating an Invoice, preserve existing Line items unless instructed otherwise. If update fails due to a stale SyncToken, refetch the latest invoice and retry with the new token.',
    parameters: z.object({
      invoiceId: z.string().describe('The Id of the invoice to update (required)'),
      invoice: z.object({
        Id: z.string().describe('Invoice Id (required, must match invoiceId)'),
        SyncToken: z.string().describe('Current SyncToken for the invoice (required, must be latest)'),
      }).passthrough().describe('Invoice object with updated fields, must include Id and SyncToken'),
    }),
    execute: async (params, toolContext) => {
      const qbo = getQboClientOrError(toolContext);
      params.invoice.Id = params.invoiceId;
      if (!params.invoice.SyncToken) {
        return { error: true, message: 'SyncToken is required for update' };
      }
      return new Promise((resolve) => {
        qbo.updateInvoice(params.invoice, (err, updatedInvoice) => {
          if (err && err.message && err.message.includes('SyncToken')) {
            return resolve({ error: true, message: 'SyncToken is stale. Please refetch the invoice and retry with the latest SyncToken.' });
          }
          if (err) return resolve({ error: true, message: 'Failed to update invoice: ' + err.message });
          resolve(updatedInvoice);
        });
      });
    },
  }),

  deleteInvoice: tool({
    description: 'Delete an invoice by ID',
    parameters: z.object({
      invoiceId: z.string(),
    }),
    execute: async (params, toolContext) => {
      const qbo = getQboClientOrError(toolContext);
      return new Promise((resolve) => {
        qbo.deleteInvoice(params.invoiceId, (err, result) => {
          if (err) return resolve({ error: true, message: 'Failed to delete invoice: ' + err.message });
          resolve({ message: 'Invoice deleted successfully', result });
        });
      });
    },
  }),

  sendInvoicePdf: tool({
    description: 'Send an invoice PDF to a customer by email',
    parameters: z.object({
      invoiceId: z.string().describe('The ID of the invoice to send'),
      email: z.string().describe('The email address to send the invoice to'),
    }),
    execute: async (params, toolContext) => {
      const qbo = getQboClientOrError(toolContext);
      return new Promise((resolve) => {
        qbo.sendInvoicePdf(params.invoiceId, params.email, (err, result) => {
          if (err) return resolve({ error: true, message: 'Failed to send invoice: ' + err.message });
          resolve({ message: 'Invoice sent successfully', result });
        });
      });
    },
  }),
};