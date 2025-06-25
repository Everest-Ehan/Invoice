import { z } from 'zod';
import { callQuickBooksApi } from '../quickbooks/api.js';
import tokenStore from '../quickbooks/tokenStore.js';

// Minimal helper to wrap tool definition
const tool = (def) => def;

const invoiceTools = {
  getInvoice: tool({
    description: 'Get details of a specific invoice by ID',
    parameters: z.object({
      invoiceId: z.string().describe('The ID of the invoice to retrieve'),
    }),
    async execute({ invoiceId }) {
      const url = `https://quickbooks.api.intuit.com/v3/company/${tokenStore.realmId}/invoice/${invoiceId}`;
      const config = {
        method: 'get',
        url,
        headers: {
          'Accept': 'application/json',
        },
      };
      const response = await callQuickBooksApi(config);
      return response.data;
    },
  }),

  listInvoices: tool({
    description: 'List invoices with optional criteria',
    parameters: z.object({
      criteria: z.string().optional().describe('Query criteria for filtering invoices'),
    }),
    async execute({ criteria }) {
      return { criteria, status: 'stub', data: [] };
    },
  }),

  createInvoice: tool({
    description: 'Create a new invoice',
    parameters: z.object({
      invoiceData: z.any().describe('Invoice object as per QuickBooks API'),
    }),
    async execute({ invoiceData }) {
      return { invoiceData, status: 'stub', data: null };
    },
  }),

  updateInvoice: tool({
    description: 'Update an existing invoice',
    parameters: z.object({
      invoiceData: z.any().describe('Updated invoice object'),
    }),
    async execute({ invoiceData }) {
      return { invoiceData, status: 'stub', data: null };
    },
  }),

  deleteInvoice: tool({
    description: 'Delete an invoice by ID',
    parameters: z.object({
      invoiceId: z.string().describe('The ID of the invoice to delete'),
    }),
    async execute({ invoiceId }) {
      return { invoiceId, status: 'stub', data: null };
    },
  }),

  emailInvoicePdf: tool({
    description: 'Email an invoice PDF to a recipient',
    parameters: z.object({
      invoiceId: z.string().describe('The ID of the invoice'),
      sendTo: z.string().email().describe('Recipient email address'),
    }),
    async execute({ invoiceId, sendTo }) {
      return { invoiceId, sendTo, status: 'stub', data: null };
    },
  }),
};

export default invoiceTools;
