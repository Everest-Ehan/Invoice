import express from "express";
import cors from "cors";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import {invoiceTools} from "../tools/invoiceTools.js";

const router = express.Router();

const model1 = openai('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.5,
});

// System prompt to guide the AI on using QuickBooks invoice tools
const systemPrompt = `You are a financial assistant for QuickBooks. You help users view, search, and manage invoices using ONLY the provided tools.

TOOLS:
- listInvoices: List invoices with filtering (customer, date, status, amount, etc.)
- getInvoice: Get details of a specific invoice by ID
- createInvoice: Create a new invoice
- updateInvoice: Update an existing invoice
- deleteInvoice: Delete (void) an invoice
- emailInvoicePdf: Email an invoice PDF

INVOICE CREATION RULES:
When creating invoices, you MUST follow this exact structure:
{
  "CustomerRef": {
    "value": "CUSTOMER_ID",
    "name": "Customer Name"
  },
  "Line": [
    {
      "DetailType": "SalesItemLineDetail",
      "Amount": 100.00,
      "SalesItemLineDetail": {
        "ItemRef": {
          "value": "ITEM_ID",
          "name": "Item Name"
        }
      }
    }
  ]
}

REQUIRED FIELDS:
- CustomerRef.value (Customer ID) - ALWAYS required
- Line array with at least one item - ALWAYS required
- Each Line must have: DetailType, Amount, and ItemRef.value
- Amount must be a number, not a string

INVOICE UPDATE RULES:
- Always retrieve the object first using its Id to get the current SyncToken and existing data.
- Id and SyncToken are both required for updates and must reflect the latest state of the object.
- Modify only the fields that need changes, but always include the original Id, the updated SyncToken, and any required fields like CustomerRef or Line.
- If you are updating an Invoice, preserve existing Line items unless instructed otherwise.
- If the update fails due to a stale SyncToken, you must refetch the latest version of the object and retry with the new token.

IF FIELDS ARE MISSING:
- Assign dummy data in the missing fields
- If the user asks for a specific invoice, create a dummy invoice with the same ID as the requested invoice
- CustomerRef.value is from 1 to 31 if you need to create a dummy invoice

RULES:
1. ALWAYS use tools for any invoice-related request. NEVER make up or hallucinate invoice data.
2. NEVER include JSON or invoice data in your text response. Only return plain conversational summaries in text.
3. For all invoice data, rely on tool calls and tool results only. Do not display, summarize, or reformat JSON in your text.
4. If a user requests many or all invoices, fetch and process up to 20 at a time. If there are more, continue fetching in subsequent steps using the correct offset (pagination) until all are processed.
5. For each batch, add the results to the invoices list. Continue until all requested invoices are fetched.
6. For single-invoice requests, always use the tool and return the result only in toolResults.
7. For any other request, use the most appropriate tool and return the result only in toolResults.
8. Keep your text responses short and conversational, but NEVER include or reference JSON or invoice data in the text.
9. When creating invoices, ALWAYS provide CustomerRef.value and at least one Line item with proper structure.

EXAMPLES:
User: "Show all invoices" → "Here are your invoices." (all data in toolResults only, never in text)
User: "Show invoice 129" → "Here's invoice 129." (all data in toolResults only, never in text)
User: "Show paid invoices" → "Here are your paid invoices." (all data in toolResults only, never in text)
User: "Create invoice for customer 123 with $100 service" → "I'll create that invoice for you." (use createInvoice tool with proper structure)
User: "Update invoice 129 to change the amount to $200" → "I'll update invoice 129 for you." (First, use getInvoice to fetch the latest invoice, extract Id and SyncToken, then call updateInvoice with the new field(s) and the latest Id and SyncToken. If update fails due to SyncToken, refetch and retry.)

ALWAYS USE TOOLS. NEVER HALLUCINATE DATA. NEVER INCLUDE JSON OR INVOICE DATA IN TEXT. PAGINATE IF NEEDED.`;

router.post("/chat", async (req, res) => {
  const { message: userMessage, accessToken, refreshToken, realmId } = req.body;

  // Validate required QuickBooks tokens
  if (!accessToken || !refreshToken || !realmId) {
    return res.status(400).json({
      error: 'Missing QuickBooks authentication tokens',
      message: 'Please authenticate with QuickBooks before using invoice features.'
    });
  }

  console.log('🤖 AI Request:', userMessage);
  console.log('🔧 Available tools:', Object.keys(invoiceTools));

  // Wrap tools to inject tokens as the second argument
  const wrappedTools = {};
  for (const [name, tool] of Object.entries(invoiceTools)) {
    wrappedTools[name] = {
      ...tool,
      execute: (params) => tool.execute(params, { accessToken, refreshToken, realmId })
    };
  }

  try {
    // toolContext is not supported by the SDK, so we inject tokens via wrappedTools
    let invoiceData = [];
    const { text, toolResults, steps } = await generateText({
      model: model1,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      tools: wrappedTools,
      toolChoice: 'auto', // let the model choose
      maxSteps: 5,
      onStepFinish: (step) => {
        if (step.toolResults && step.toolResults.length > 0) {
          for (const result of step.toolResults) {
            if (result.result && Array.isArray(result.result.invoices)) {
              invoiceData = invoiceData.concat(result.result.invoices);
              // console.log(JSON.stringify(result.result.invoices, null, 2));
            } else if (result.result && !result.result.error && !Array.isArray(result.result.invoices)) {
              // If it's a single invoice object (not error), add it
              invoiceData.push(result.result);
              // console.log('Single invoice added:', JSON.stringify(result.result, null, 2));
            }
          }
          // Remove duplicates by Id, keeping the latest (last) occurrence
          const seen = new Map();
          for (let i = invoiceData.length - 1; i >= 0; i--) {
            const inv = invoiceData[i];
            const id = inv.Id || inv.DocNumber;
            if (id && !seen.has(id)) {
              seen.set(id, i);
            }
          }
          invoiceData = Array.from(seen.values()).map(idx => invoiceData[idx]);
        }
        console.log('🔧 Step finished:', step.toolResults);
      }
    });

    console.log('🤖 AI Response text:', text);
    
    // Only process tool results for debugging/logging, not for invoice extraction
    let processedToolResults = [];
    if (toolResults && toolResults.length > 0) {
      for (const result of toolResults) {
        processedToolResults.push({
          toolName: result.toolName,
          result: result.result
        });
      }
    }

    res.json({
      text: text,
      toolResults: processedToolResults,
      invoices: invoiceData,
      hasInvoices: invoiceData.length > 0
    });

  } catch (error) {
    console.error('❌ AI Chat Error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      message: error.message
    });
  }
});

export default router;
