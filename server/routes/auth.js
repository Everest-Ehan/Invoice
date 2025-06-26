import express from 'express';
import axios from 'axios';
import persistentTokenStore from '../quickbooks/persistentTokenStore.js';
import { refreshQuickBooksToken } from '../quickbooks/refreshToken.js';

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
    
    persistentTokenStore.saveTokens(
      tokenRes.data.access_token,
      tokenRes.data.refresh_token,
      realmId,
      expiresIn
    );

    // Redirect to frontend with tokens in URL params for localStorage
    const tokens = encodeURIComponent(JSON.stringify({
      accessToken: tokenRes.data.access_token,
      refreshToken: tokenRes.data.refresh_token,
      realmId: realmId,
      expiresAt: expiresAt
    }));

    res.redirect(`http://localhost:3000?tokens=${tokens}`);
  } catch (err) {
    res.status(500).send('OAuth failed: ' + (err.response?.data?.error_description || err.message));
  }
});

// Add logout endpoint to clear tokens and re-authenticate
router.get('/logout', (req, res) => {
  persistentTokenStore.clearTokens();
  res.json({ message: 'Logged out successfully. You can now re-authenticate.' });
});

// Token validation endpoint
router.get('/validate-token', (req, res) => {
  const tokens = persistentTokenStore.getTokens();
  
  if (!tokens.accessToken) {
    return res.status(401).json({ 
      valid: false, 
      message: 'No access token found',
      needsAuth: true 
    });
  }

  if (!persistentTokenStore.isTokenValid()) {
    return res.status(401).json({ 
      valid: false, 
      message: 'Access token expired',
      needsRefresh: true,
      hasRefreshToken: !!tokens.refreshToken
    });
  }

  res.json({ 
    valid: true, 
    message: 'Token is valid',
    realmId: tokens.realmId,
    expiresAt: tokens.expiresAt
  });
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    const newAccessToken = await refreshQuickBooksToken();
    const tokens = persistentTokenStore.getTokens();
    
    res.json({ 
      success: true, 
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      expiresAt: tokens.expiresAt
    });
  } catch (error) {
    console.error('Token refresh failed:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token refresh failed',
      error: error.message 
    });
  }
});

// Sync tokens from frontend
router.post('/sync-tokens', (req, res) => {
  const { accessToken, refreshToken, realmId, expiresAt } = req.body;
  
  if (accessToken && realmId) {
    persistentTokenStore.setTokens({ accessToken, refreshToken, realmId, expiresAt });
    res.json({ success: true, message: 'Tokens synced successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Missing required tokens' });
  }
});

// Debug endpoint to check token status
router.get('/debug-tokens', (req, res) => {
  const tokens = persistentTokenStore.getTokens();
  const isValid = persistentTokenStore.isTokenValid();
  
  res.json({
    tokens_available: !!tokens.accessToken,
    token_valid: isValid,
    token_info: {
      has_access_token: !!tokens.accessToken,
      has_realm_id: !!tokens.realmId,
      has_refresh_token: !!tokens.refreshToken,
      expires_at: tokens.expiresAt ? new Date(tokens.expiresAt).toISOString() : null,
      is_expired: tokens.expiresAt ? Date.now() > tokens.expiresAt : false,
      time_until_expiry: tokens.expiresAt ? Math.floor((tokens.expiresAt - Date.now()) / 1000) : null
    },
    next_steps: isValid ? 
      'Tokens are valid and ready to use' : 
      tokens.accessToken ? 'Token expired, try /refresh-token' : 'No tokens, need to authenticate'
  });
});

export default router;