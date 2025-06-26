import axios from 'axios';
import persistentTokenStore from './persistentTokenStore.js';

export async function refreshQuickBooksToken() {
  const tokens = persistentTokenStore.getTokens();
  if (!tokens.refreshToken) throw new Error('No refresh token available');
  
  try {
    const tokenRes = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`).toString('base64'),
        },
      }
    );

    // Save the new tokens with expiry time
    const expiresIn = tokenRes.data.expires_in || 3600;
    persistentTokenStore.saveTokens(
      tokenRes.data.access_token,
      tokenRes.data.refresh_token,
      tokens.realmId, // Keep the same realm ID
      expiresIn
    );

    console.log('Token refreshed successfully');
    return tokenRes.data.access_token;
  } catch (err) {
    console.error('Failed to refresh QuickBooks token:', err.response?.data || err.message);
    throw new Error('Failed to refresh QuickBooks token');
  }
} 