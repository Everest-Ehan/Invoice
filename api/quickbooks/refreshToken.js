import axios from 'axios';

export async function refreshQuickBooksToken(refreshToken, realmId) {
  if (!refreshToken) throw new Error('No refresh token available');
  try {
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
    return {
      accessToken: tokenRes.data.access_token,
      refreshToken: tokenRes.data.refresh_token,
      realmId,
      expiresAt: Date.now() + (expiresIn * 1000)
    };
  } catch (err) {
    throw new Error('Failed to refresh QuickBooks token');
  }
} 