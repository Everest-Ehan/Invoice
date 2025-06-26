// api/quickbooks/vercelTokenStore.js
import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const TOKEN_FILE = path.resolve(process.env.TOKEN_FILE_PATH || './tokens.json');
const TOKEN_KEY = 'quickbooks_tokens';

// Helper functions for local file storage (development)
function readTokensFromFile() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to read tokens from file:', e);
  }
  return {};
}

function writeTokensToFile(tokens) {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write tokens to file:', e);
  }
}

// Check if we're running on Vercel (serverless environment)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

const vercelTokenStore = {
  async getTokens() {
    try {
      let tokens;
      
      if (isVercel) {
        // Use Vercel KV in production
        tokens = await kv.get(TOKEN_KEY) || {};
      } else {
        // Use file system in development
        tokens = readTokensFromFile();
      }
      
      console.log('🔑 Getting tokens from store:', {
        environment: isVercel ? 'production (KV)' : 'development (file)',
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        hasRealmId: !!tokens.realmId,
        expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt).toISOString() : null
      });
      
      return tokens;
    } catch (error) {
      console.error('Failed to get tokens:', error);
      return {};
    }
  },

  async setTokens(tokens) {
    try {
      let currentTokens;
      
      if (isVercel) {
        // Get current tokens from KV
        currentTokens = await kv.get(TOKEN_KEY) || {};
        // Merge and save to KV
        const updatedTokens = { ...currentTokens, ...tokens };
        await kv.set(TOKEN_KEY, updatedTokens);
      } else {
        // Use file system in development
        currentTokens = readTokensFromFile();
        const updatedTokens = { ...currentTokens, ...tokens };
        writeTokensToFile(updatedTokens);
      }
      
      console.log('💾 Setting tokens in store:', {
        environment: isVercel ? 'production (KV)' : 'development (file)',
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        hasRealmId: !!tokens.realmId,
        expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt).toISOString() : null
      });
    } catch (error) {
      console.error('Failed to set tokens:', error);
    }
  },

  async clearTokens() {
    try {
      console.log('🗑️ Clearing tokens from store');
      
      if (isVercel) {
        await kv.del(TOKEN_KEY);
      } else {
        writeTokensToFile({});
      }
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  },

  async isTokenValid() {
    try {
      const tokens = await this.getTokens();
      const { accessToken, expiresAt } = tokens;
      const isValid = accessToken && expiresAt && Date.now() < Number(expiresAt);
      
      console.log('✅ Token validation check:', {
        hasAccessToken: !!accessToken,
        hasExpiresAt: !!expiresAt,
        isExpired: expiresAt ? Date.now() >= Number(expiresAt) : false,
        isValid
      });
      
      return isValid;
    } catch (error) {
      console.error('Failed to validate token:', error);
      return false;
    }
  },

  async saveTokens(accessToken, refreshToken, realmId, expiresIn) {
    const expiresAt = Date.now() + (expiresIn * 1000);
    
    console.log('💾 Saving new tokens:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasRealmId: !!realmId,
      expiresIn,
      expiresAt: new Date(expiresAt).toISOString()
    });
    
    await this.setTokens({ accessToken, refreshToken, realmId, expiresAt });
  }
};

export default vercelTokenStore;
