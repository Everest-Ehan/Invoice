import express from 'express';
import { callQuickBooksApi } from '../quickbooks/api.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Hello from server!',
    quickbooksConnected: !!req.query.accessToken,
    quickbooksClientId: process.env.QB_CLIENT_ID,
    quickbooksClientSecret: process.env.QB_CLIENT_SECRET,
    quickbooksRedirectUri: process.env.QB_REDIRECT_URI,
    quickbooksRealmId: req.query.realmId,
    quickbooksAccessToken: req.query.accessToken,
    quickbooksRefreshToken: req.query.refreshToken,
    quickbooksExpiresAt: req.query.expiresAt,
  });
});

router.get('/status', (req, res) => {
  res.json({ connected: !!req.query.accessToken });
});

router.get('/tokens', (req, res) => {
  if (!req.query.accessToken) return res.status(401).json({ error: 'Not connected' });
  res.json({
    accessToken: req.query.accessToken,
    realmId: req.query.realmId
  });
});

// Test endpoint to verify QuickBooks API connection
router.get('/test-quickbooks', async (req, res) => {
  if (!req.query.accessToken) {
    return res.status(401).json({ error: 'Not connected to QuickBooks' });
  }

  try {
    // Test 1: Try to list invoices (most basic operation)
    const query = 'SELECT * FROM Invoice MAXRESULTS 5';
    const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${req.query.realmId}/query?query=${encodeURIComponent(query)}`;
    
    const config = {
      method: 'get',
      url,
      headers: {
        'Accept': 'application/json',
      },
    };

    const response = await callQuickBooksApi(config);
    const invoices = response.data.QueryResponse?.Invoice || [];
    
    res.json({
      status: 'success',
      message: 'QuickBooks API connection working!',
      testResults: {
        connection: '✅ Connected',
        realmId: req.query.realmId,
        invoicesFound: invoices.length,
        sampleInvoice: invoices[0] ? {
          id: invoices[0].Id,
          docNumber: invoices[0].DocNumber,
          totalAmt: invoices[0].TotalAmt,
          balance: invoices[0].Balance
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'QuickBooks API test failed',
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
});

// Simple test to check if we can access any QuickBooks data
router.get('/test-company', async (req, res) => {
  if (!req.query.accessToken) {
    return res.status(401).json({ error: 'Not connected to QuickBooks' });
  }

  try {
    // Try to get company info (this should work even without invoice permissions)
    const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${req.query.realmId}/companyinfo/${req.query.realmId}`;
    
    const config = {
      method: 'get',
      url,
      headers: {
        'Accept': 'application/json',
      },
    };

    const response = await callQuickBooksApi(config);
    const company = response.data.CompanyInfo;
    
    res.json({
      status: 'success',
      message: 'Company info retrieved successfully',
      company: {
        id: company.Id,
        name: company.CompanyName,
        legalName: company.LegalName,
        country: company.Country,
        email: company.Email?.Address,
        webSite: company.WebAddr?.URI
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get company info',
      error: error.message,
      details: error.response?.data || 'No additional details',
      debug: {
        realmId: req.query.realmId,
        hasAccessToken: !!req.query.accessToken,
        tokenValid: req.query.accessToken && req.query.expiresAt > Date.now()
      }
    });
  }
});

export default router; 