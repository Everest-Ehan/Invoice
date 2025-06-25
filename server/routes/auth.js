import express from 'express';
import axios from 'axios';
import tokenStore from '../quickbooks/tokenStore.js';

const router = express.Router();

router.get('/quickbooks', (req, res) => {
  const redirectUri = encodeURIComponent(process.env.QB_REDIRECT_URI);
  const clientId = process.env.QB_CLIENT_ID;
  const scope = encodeURIComponent('com.intuit.quickbooks.accounting');
  const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=secureRandomState`;
  res.redirect(authUrl);
});

router.get('/quickbooks/callback', async (req, res) => {
  const { code, realmId } = req.query;
  if (!code) return res.status(400).send('Missing code');

  try {
    const tokenRes = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.QB_REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`).toString('base64'),
        },
      }
    );

    tokenStore.accessToken = tokenRes.data.access_token;
    tokenStore.refreshToken = tokenRes.data.refresh_token;
    tokenStore.realmId = realmId;

    res.redirect('http://localhost:3000');
  } catch (err) {
    res.status(500).send('OAuth failed: ' + (err.response?.data?.error_description || err.message));
  }
});

export default router; 