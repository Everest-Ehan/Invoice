import axios from 'axios';
import tokenStore from './tokenStore.js';
import { refreshQuickBooksToken } from './refreshToken.js';

export async function callQuickBooksApi(config) {
  try {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${tokenStore.accessToken}`;
    return await axios(config);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      await refreshQuickBooksToken();
      config.headers['Authorization'] = `Bearer ${tokenStore.accessToken}`;
      return await axios(config);
    }
    throw err;
  }
} 