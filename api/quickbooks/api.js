import axios from 'axios';
import { refreshQuickBooksToken } from './refreshToken.js';

export async function callQuickBooksApi(config, tokens) {
  try {
    // Check if token is valid before making request
    if (!tokens.expiresAt || Date.now() >= Number(tokens.expiresAt)) {
      console.log('Access token expired, attempting refresh...');
      const refreshed = await refreshQuickBooksToken(tokens.refreshToken, tokens.realmId);
      tokens.accessToken = refreshed.accessToken;
      tokens.refreshToken = refreshed.refreshToken;
      tokens.expiresAt = refreshed.expiresAt;
    }
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    return await axios(config);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log('401 error, attempting token refresh...');
      try {
        const refreshed = await refreshQuickBooksToken(tokens.refreshToken, tokens.realmId);
        tokens.accessToken = refreshed.accessToken;
        tokens.refreshToken = refreshed.refreshToken;
        tokens.expiresAt = refreshed.expiresAt;
        config.headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        return await axios(config);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.message);
        throw new Error('Authentication failed. Please reconnect to QuickBooks.');
      }
    }
    throw err;
  }
} 