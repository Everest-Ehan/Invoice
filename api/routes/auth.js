import express from 'express';
import axios from 'axios';

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

    // Save tokens with expiry time
    const expiresIn = tokenRes.data.expires_in || 3600;
    const expiresAt = Date.now() + (expiresIn * 1000);
    
    // Redirect to frontend with tokens in URL params for localStorage
    const tokens = encodeURIComponent(JSON.stringify({
      accessToken: tokenRes.data.access_token,
      refreshToken: tokenRes.data.refresh_token,
      realmId: realmId,
      expiresAt: expiresAt
    }));

    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || 'https://invoice-um37.onrender.com/'
      : 'http://localhost:3000';
    
    res.redirect(`${frontendUrl}?tokens=${tokens}`);
  } catch (err) {
    res.status(500).send('OAuth failed: ' + (err.response?.data?.error_description || err.message));
  }
});

// Refactor /validate-token to accept tokens from req.body (POST) or req.query (GET)
router.post('/validate-token', async (req, res) => {
  const { accessToken, refreshToken, realmId, expiresAt } = req.body;
  if (!accessToken) {
    return res.status(401).json({ valid: false, message: 'No access token found', needsAuth: true });
  }
  if (!expiresAt || Date.now() >= Number(expiresAt)) {
    return res.status(401).json({ valid: false, message: 'Access token expired', needsRefresh: true, hasRefreshToken: !!refreshToken });
  }
  res.json({ valid: true, message: 'Token is valid', realmId, expiresAt });
});

// Refactor /refresh-token to accept refreshToken and realmId from req.body
router.post('/refresh-token', async (req, res) => {
  const { refreshToken, realmId } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'No refresh token provided' });
  }
  try {
    // Use the refresh token to get a new access token
    const tokenRes = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`).toString('base64'),
        },
      }
    );
    const expiresIn = tokenRes.data.expires_in || 3600;
    const expiresAt = Date.now() + (expiresIn * 1000);
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: tokenRes.data.access_token,
      refreshToken: tokenRes.data.refresh_token,
      realmId,
      expiresAt
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token refresh failed', error: error.message });
  }
});

export default router;