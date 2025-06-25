import express from 'express';
import tokenStore from '../quickbooks/tokenStore.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Hello from server!',
    quickbooksConnected: !!tokenStore.accessToken
  });
});

router.get('/status', (req, res) => {
  res.json({ connected: !!tokenStore.accessToken });
});

router.get('/tokens', (req, res) => {
  if (!tokenStore.accessToken) return res.status(401).json({ error: 'Not connected' });
  res.json({
    accessToken: tokenStore.accessToken,
    realmId: tokenStore.realmId
  });
});

export default router; 