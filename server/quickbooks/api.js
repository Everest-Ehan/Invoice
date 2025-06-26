import axios from 'axios';
import tokenStore from './tokenStore.js';
import { refreshQuickBooksToken } from './refreshToken.js';

export async function callQuickBooksApi(config) {
  try {
    // Check if token is valid before making request
    if (!tokenStore.isTokenValid()) {
      console.log('Access token expired, attempting refresh...');
      await refreshQuickBooksToken();
    }

    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${tokenStore.accessToken}`;
    return await axios(config);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log('401 error, attempting token refresh...');
      try {
        await refreshQuickBooksToken();
        config.headers['Authorization'] = `Bearer ${tokenStore.accessToken}`;
        return await axios(config);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.message);
        // If refresh fails, clear tokens and throw error
        tokenStore.clearTokens();
        throw new Error('Authentication failed. Please reconnect to QuickBooks.');
      }
    }
    throw err;
  }
}

// Helper function to get current tokens
export function getCurrentTokens() {
  return tokenStore.getTokensFromStorage();
}

// Helper function to check if connected
export function isConnected() {
  return tokenStore.accessToken && tokenStore.isTokenValid();
} 