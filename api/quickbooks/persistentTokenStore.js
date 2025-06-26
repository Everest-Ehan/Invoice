// api/quickbooks/persistentTokenStore.js
import fs from 'fs';
import path from 'path';

const TOKEN_FILE = path.resolve(process.env.TOKEN_FILE_PATH || './tokens.json');

function readTokens() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to read tokens:', e);
  }
  return {};
}

function writeTokens(tokens) {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write tokens:', e);
  }
}

let cache = readTokens();

const persistentTokenStore = {
  getTokens() {
    cache = readTokens();
    console.log('🔑 Getting tokens from persistent store:', {
      hasAccessToken: !!cache.accessToken,
      hasRefreshToken: !!cache.refreshToken,
      hasRealmId: !!cache.realmId,
      expiresAt: cache.expiresAt ? new Date(cache.expiresAt).toISOString() : null
    });
    return cache;
  },
  setTokens(tokens) {
    cache = { ...cache, ...tokens };
    console.log('💾 Setting tokens in persistent store:', {
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      hasRealmId: !!tokens.realmId,
      expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt).toISOString() : null
    });
    writeTokens(cache);
  },
  clearTokens() {
    console.log('🗑️ Clearing tokens from persistent store');
    cache = {};
    writeTokens(cache);
  },
  isTokenValid() {
    const { accessToken, expiresAt } = cache;
    const isValid = accessToken && expiresAt && Date.now() < Number(expiresAt);
    console.log('✅ Token validation check:', {
      hasAccessToken: !!accessToken,
      hasExpiresAt: !!expiresAt,
      isExpired: expiresAt ? Date.now() >= Number(expiresAt) : false,
      isValid
    });
    return isValid;
  },
  saveTokens(accessToken, refreshToken, realmId, expiresIn) {
    const expiresAt = Date.now() + (expiresIn * 1000);
    console.log('💾 Saving new tokens:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasRealmId: !!realmId,
      expiresIn,
      expiresAt: new Date(expiresAt).toISOString()
    });
    this.setTokens({ accessToken, refreshToken, realmId, expiresAt });
  }
};

export default persistentTokenStore;
