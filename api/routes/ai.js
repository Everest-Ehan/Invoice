import express from "express";
import cors from "cors";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import {invoiceTools} from "../tools/invoiceTools.js";

const router = express.Router();

const model1 = openai('gpt-4', {
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
});

// System prompt to guide the AI on using QuickBooks invoice tools
const systemPrompt = `You are a financial assistant helping users review their invoices.

TOOLS:
- listInvoices: List invoices with filtering (customer, date, status, amount, etc.)
- getInvoice: Get details of a specific invoice by ID
- createInvoice: Create a new invoice
- updateInvoice: Update an existing invoice
- deleteInvoice: Delete (void) an invoice
- emailInvoicePdf: Email an invoice PDF

RULES:
1. ALWAYS use tools for invoice requests
2. Provide ONLY brief summaries in your text response
3. NEVER include detailed invoice data in your text
4. Include raw JSON data in delimiters: ===INVOICE_DATA_START=== [JSON] ===INVOICE_DATA_END===
5. Keep text responses short and conversational
6. Use listInvoices filters to get relevant results (e.g., date ranges, customer names, status)

EXAMPLES:
User: "Show invoices" → "I found your invoices." + delimited data
User: "Show recent invoices" → "Here are your recent invoices." + delimited data (use dateFrom filter)
User: "Show invoice 129" → "Here's invoice 129." + delimited data
User: "Show paid invoices" → "Here are your paid invoices." + delimited data (use status filter)

ALWAYS USE TOOLS. NEVER HALLUCINATE DATA. KEEP TEXT RESPONSES BRIEF.`;

router.post("/chat", async (req, res) => {
  const { message: userMessage, accessToken, refreshToken, realmId } = req.body;

  console.log('🤖 AI Request:', userMessage);
  console.log('🔧 Available tools:', Object.keys(invoiceTools));

  try {
    const { text, toolResults } = await generateText({
      model: model1,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      tools: invoiceTools,
      toolChoice: 'auto', // let the model choose
      toolContext: { accessToken, refreshToken, realmId },
      maxSteps: 5,
    });

    console.log('🤖 AI Response text:', text);
    console.log('🔧 Raw tool results:', toolResults);
    console.log('🔧 Tool results length:', toolResults?.length || 0);
    console.log('🔧 Tool results keys:', toolResults ? Object.keys(toolResults) : 'null');

    // Extract invoice data from text response using delimiters
    let invoiceData = [];
    let cleanText = text;
    
    // Look for delimited data in the text response
    const delimiterRegex = /===INVOICE_DATA_START===\s*([\s\S]*?)\s*===INVOICE_DATA_END===/g;
    const matches = [...text.matchAll(delimiterRegex)];
    
    console.log('🔍 Found', matches.length, 'delimited data blocks in text');
    
    for (const match of matches) {
      try {
        const jsonData = JSON.parse(match[1].trim());
        console.log('📄 Parsed delimited data:', typeof jsonData, Array.isArray(jsonData) ? jsonData.length : 'single object');
        
        // Handle different response formats
        if (Array.isArray(jsonData)) {
          invoiceData = invoiceData.concat(jsonData);
        } else if (jsonData.invoices && Array.isArray(jsonData.invoices)) {
          // New format from listInvoices tool
          invoiceData = invoiceData.concat(jsonData.invoices);
        } else if (jsonData.Id || jsonData.Invoice) {
          // Single invoice object
          invoiceData.push(jsonData);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse delimited data:', parseError);
      }
    }
    
    // Remove the delimited data from the text response
    cleanText = text.replace(delimiterRegex, '').trim();
    
    console.log('📊 Extracted invoice data count:', invoiceData.length);
    console.log('🧹 Cleaned text length:', cleanText.length);

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
      text: cleanText,
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
