import express from 'express';
import QuickBooks from 'node-quickbooks';
import tokenStore from '../quickbooks/tokenStore.js';

const router = express.Router();

// Helper function to get QuickBooks client or throw error
function getQboClientOrError() {
  if (!tokenStore.accessToken || !tokenStore.realmId) {
    throw new Error('No valid tokens available. Please complete OAuth flow first.');
  }
  
  const qbo = new QuickBooks(
    process.env.QB_CLIENT_ID,           // clientId
    process.env.QB_CLIENT_SECRET,       // clientSecret  
    tokenStore.accessToken,             // accessToken
    tokenStore.refreshToken,            // refreshToken
    tokenStore.realmId,                 // realmId
    process.env.NODE_ENV !== 'production', // useSandbox
    process.env.NODE_ENV !== 'production', // debug
    null,                               // minorversion
    '2.0',                              // oauthversion
    process.env.QB_CLIENT_SECRET        // tokenSecret (using client secret)
  );
  return qbo;
}

// Get all invoices as JSON
router.get('/all', (req, res) => {
  try {
    const qbo = getQboClientOrError();
    const { limit = 100, offset = 0, criteria } = req.query;
    
    // Build query string
    let query = 'SELECT * FROM Invoice';
    if (criteria) {
      query += ` WHERE ${criteria}`;
    }
    query += ` MAXRESULTS ${limit} STARTPOSITION ${offset}`;

    console.log('🔍 Querying invoices with:', query);
    
    qbo.query(query, (err, invoices) => {
      if (err) {
        console.error('❌ QBO Error:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to fetch invoices', 
          message: err.message,
          details: err
        });
      }

      console.log('✅ Success! Found', invoices.length, 'invoices');

      // Format the response
      const formattedInvoices = invoices.map(invoice => ({
        id: invoice.Id,
        docNumber: invoice.DocNumber,
        totalAmount: invoice.TotalAmt,
        balance: invoice.Balance,
        transactionDate: invoice.TxnDate,
        dueDate: invoice.DueDate,
        customerName: invoice.CustomerRef?.name,
        customerId: invoice.CustomerRef?.value,
        status: invoice.EmailStatus,
        lineItems: invoice.Line?.map(line => ({
          amount: line.Amount,
          description: line.Description,
          detailType: line.DetailType,
          itemId: line.SalesItemLineDetail?.ItemRef?.value,
          itemName: line.SalesItemLineDetail?.ItemRef?.name
        })) || [],
        shipFromAddress: invoice.ShipFromAddr ? {
          line1: invoice.ShipFromAddr.Line1,
          city: invoice.ShipFromAddr.City,
          state: invoice.ShipFromAddr.CountrySubDivisionCode,
          postalCode: invoice.ShipFromAddr.PostalCode,
          country: invoice.ShipFromAddr.Country
        } : null,
        billEmail: invoice.BillEmail?.Address,
        memo: invoice.Memo,
        privateNote: invoice.PrivateNote,
        active: invoice.Active
      }));

      res.json({
        success: true,
        count: formattedInvoices.length,
        totalCount: invoices.length,
        invoices: formattedInvoices,
        query: query
      });
    });

  } catch (error) {
    console.error('❌ Error in /all:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize QuickBooks client',
      message: error.message
    });
  }
});

// Get a specific invoice by ID
router.get('/:id', (req, res) => {
  try {
    const qbo = getQboClientOrError();
    const { id } = req.params;

    qbo.getInvoice(id, (err, invoice) => {
      if (err) {
        console.error('❌ QBO Error:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to fetch invoice', 
          message: err.message,
          details: err
        });
      }

      // Format the response
      const formattedInvoice = {
        id: invoice.Id,
        docNumber: invoice.DocNumber,
        totalAmount: invoice.TotalAmt,
        balance: invoice.Balance,
        transactionDate: invoice.TxnDate,
        dueDate: invoice.DueDate,
        customerName: invoice.CustomerRef?.name,
        customerId: invoice.CustomerRef?.value,
        status: invoice.EmailStatus,
        lineItems: invoice.Line?.map(line => ({
          amount: line.Amount,
          description: line.Description,
          detailType: line.DetailType,
          itemId: line.SalesItemLineDetail?.ItemRef?.value,
          itemName: line.SalesItemLineDetail?.ItemRef?.name
        })) || [],
        shipFromAddress: invoice.ShipFromAddr ? {
          line1: invoice.ShipFromAddr.Line1,
          city: invoice.ShipFromAddr.City,
          state: invoice.ShipFromAddr.CountrySubDivisionCode,
          postalCode: invoice.ShipFromAddr.PostalCode,
          country: invoice.ShipFromAddr.Country
        } : null,
        billEmail: invoice.BillEmail?.Address,
        memo: invoice.Memo,
        privateNote: invoice.PrivateNote,
        active: invoice.Active
      };

      res.json({
        success: true,
        invoice: formattedInvoice
      });
    });

  } catch (error) {
    console.error('❌ Error in /:id:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize QuickBooks client',
      message: error.message
    });
  }
});

// Get invoices with simple filtering
router.get('/search/:criteria', (req, res) => {
  try {
    const qbo = getQboClientOrError();
    const { criteria } = req.params;
    const { limit = 50 } = req.query;

    const query = `SELECT * FROM Invoice WHERE ${criteria} MAXRESULTS ${limit}`;
    
    console.log('🔍 Searching invoices with:', query);
    
    qbo.query(query, (err, invoices) => {
      if (err) {
        console.error('❌ QBO Error:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to search invoices', 
          message: err.message,
          details: err
        });
      }

      // Format the response (same as /all endpoint)
      const formattedInvoices = invoices.map(invoice => ({
        id: invoice.Id,
        docNumber: invoice.DocNumber,
        totalAmount: invoice.TotalAmt,
        balance: invoice.Balance,
        transactionDate: invoice.TxnDate,
        dueDate: invoice.DueDate,
        customerName: invoice.CustomerRef?.name,
        customerId: invoice.CustomerRef?.value,
        status: invoice.EmailStatus,
        lineItems: invoice.Line?.map(line => ({
          amount: line.Amount,
          description: line.Description,
          detailType: line.DetailType,
          itemId: line.SalesItemLineDetail?.ItemRef?.value,
          itemName: line.SalesItemLineDetail?.ItemRef?.name
        })) || [],
        shipFromAddress: invoice.ShipFromAddr ? {
          line1: invoice.ShipFromAddr.Line1,
          city: invoice.ShipFromAddr.City,
          state: invoice.ShipFromAddr.CountrySubDivisionCode,
          postalCode: invoice.ShipFromAddr.PostalCode,
          country: invoice.ShipFromAddr.Country
        } : null,
        billEmail: invoice.BillEmail?.Address,
        memo: invoice.Memo,
        privateNote: invoice.PrivateNote,
        active: invoice.Active
      }));

      res.json({
        success: true,
        count: formattedInvoices.length,
        invoices: formattedInvoices,
        searchCriteria: criteria,
        query: query
      });
    });

  } catch (error) {
    console.error('❌ Error in /search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize QuickBooks client',
      message: error.message
    });
  }
});

export default router; 