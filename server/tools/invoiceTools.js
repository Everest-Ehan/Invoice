import { z } from 'zod';
import { tool } from 'ai';
import QuickBooks from 'node-quickbooks';
import persistentTokenStore from '../quickbooks/persistentTokenStore.js';
import axios from 'axios';

function getQboClientOrError() {
  const tokens = persistentTokenStore.getTokens();
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
    execute: async ({ invoiceId }) => {
      const qbo = getQboClientOrError();
      return new Promise((resolve, reject) => {
        qbo.getInvoice(invoiceId, (err, invoice) => {
          if (err) return reject(new Error('Failed to fetch invoice: ' + err.message));
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
    execute: async ({ 
      maxResults = 10, 
      startPosition = 1,
      customerId,
      customerName,
      status,
      dateFrom,
      dateTo,
      dueDateFrom,
      dueDateTo,
      totalFrom,
      totalTo,
      docNumber,
      balanceFrom,
      balanceTo
    }) => {
      const tokens = persistentTokenStore.getTokens();
      const baseUrl = 'https://sandbox-quickbooks.api.intuit.com';
      let queryString = 'SELECT * FROM Invoice';
      const conditions = [];
      if (customerId) conditions.push(`CustomerRef = '${customerId}'`);
      // QuickBooks Online SQL does NOT support subqueries. To filter by customer name, first look up the customer ID by name, then use customerId.
      // if (customerName) conditions.push(`CustomerRef IN (SELECT Id FROM Customer WHERE DisplayName LIKE '%${customerName.replace(/'/g, "''")}%')`);
      if (status && status !== 'All') conditions.push(`PrivateNote = '${status}'`);
      if (dateFrom) conditions.push(`TxnDate >= '${dateFrom}'`);
      if (dateTo) conditions.push(`TxnDate <= '${dateTo}'`);
      if (dueDateFrom) conditions.push(`DueDate >= '${dueDateFrom}'`);
      if (dueDateTo) conditions.push(`DueDate <= '${dueDateTo}'`);
      if (totalFrom !== undefined) conditions.push(`TotalAmt >= '${totalFrom}'`);
      if (totalTo !== undefined) conditions.push(`TotalAmt <= '${totalTo}'`);
      if (docNumber) conditions.push(`DocNumber LIKE '%${docNumber.replace(/'/g, "''")}%'`);
      if (balanceFrom !== undefined) conditions.push(`Balance >= '${balanceFrom}'`);
      if (balanceTo !== undefined) conditions.push(`Balance <= '${balanceTo}'`);
      if (conditions.length > 0) {
        queryString += ' WHERE ' + conditions.join(' AND ');
      }
      queryString += ' ORDER BY TxnDate DESC';
      if (maxResults) {
        queryString += ` MAXRESULTS ${Math.min(maxResults, 1000)}`;
      }
      
        console.log('🔍 Query executed:', queryString)
      try {
        const response = await axios.get(`${baseUrl}/v3/company/${tokens.realmId}/query`, {
          params: {
            query: queryString,
            startposition: startPosition
          },
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            Accept: 'application/json'
          }
        });

        const data = response.data;
        console.log('📊 Response:', data);
        console.log('Max Results:', Math.min(maxResults, 1000));
        const invoiceList = data.QueryResponse?.Invoice || [];
        const totalCount = data.QueryResponse?.totalCount || 0;
        return {
          invoices: invoiceList,  
          totalCount,
          startPosition,
          maxResults: Math.min(maxResults, 1000),
          query: queryString,
          filters: {
            customerId,
            customerName,
            status,
            dateFrom,
            dateTo,
            dueDateFrom,
            dueDateTo,
            totalFrom,
            totalTo,
            docNumber,
            balanceFrom,
            balanceTo
          }
        };
      } catch (err) {
        if (err.response && err.response.data) {
          console.error('❌ QuickBooks API Error:', JSON.stringify(err.response.data, null, 2));
        } else {
          console.error('❌ QuickBooks API Error:', err.message);
        }
        throw new Error('Failed to fetch invoices: ' + (err.response && err.response.data ? JSON.stringify(err.response.data) : err.message));
      }
    },
  }),

  createInvoice: tool({
    description: 'Create a new invoice',
    parameters: z.object({
      invoice: z.object({}).passthrough(),
    }),
    execute: async ({ invoice }) => {
      const qbo = getQboClientOrError();
      return new Promise((resolve, reject) => {
        qbo.createInvoice(invoice, (err, createdInvoice) => {
          if (err) return reject(new Error('Failed to create invoice: ' + err.message));
          resolve(createdInvoice);
        });
      });
    },
  }),

  updateInvoice: tool({
    description: 'Update an existing invoice by ID',
    parameters: z.object({
      invoiceId: z.string(),
      invoice: z.object({}).passthrough(),
    }),
    execute: async ({ invoiceId, invoice }) => {
      const qbo = getQboClientOrError();
      invoice.Id = invoiceId;
      return new Promise((resolve, reject) => {
        qbo.updateInvoice(invoice, (err, updatedInvoice) => {
          if (err) return reject(new Error('Failed to update invoice: ' + err.message));
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
    execute: async ({ invoiceId }) => {
      const qbo = getQboClientOrError();
      return new Promise((resolve, reject) => {
        qbo.deleteInvoice(invoiceId, (err, result) => {
          if (err) return reject(new Error('Failed to delete invoice: ' + err.message));
          resolve({ message: 'Invoice deleted successfully', result });
        });
      });
    },
  }),

  emailInvoicePdf: tool({
    description: 'Send an invoice PDF to an email address',
    parameters: z.object({
      invoiceId: z.string(),
      email: z.string().email(),
    }),
    execute: async ({ invoiceId, email }) => {
      const qbo = getQboClientOrError();
      return new Promise((resolve, reject) => {
        qbo.sendInvoicePdf(invoiceId, email, (err, result) => {
          if (err) return reject(new Error('Failed to send invoice: ' + err.message));
          resolve({ message: 'Invoice sent successfully', result });
        });
      });
    },
  }),
};