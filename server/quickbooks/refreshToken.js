import axios from 'axios';
import tokenStore from './tokenStore.js';

export async function refreshQuickBooksToken() {
  if (!tokenStore.refreshToken) throw new Error('No refresh token available');
  try {
    const tokenRes = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenStore.refreshToken,
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
    return tokenStore.accessToken;
  } catch (err) {
    console.error('Failed to refresh QuickBooks token:', err.response?.data || err.message);
    throw new Error('Failed to refresh QuickBooks token');
  }
} 