const tokenStore = {
  accessToken: null,
  refreshToken: null,
  realmId: null,
  expiresAt: null,

  // Save tokens (server-side only)
  saveTokens(accessToken, refreshToken, realmId, expiresIn = 3600) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.realmId = realmId;
    this.expiresAt = Date.now() + (expiresIn * 1000);
  },

  // Clear all tokens
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.realmId = null;
    this.expiresAt = null;
  },

  // Check if access token is valid (not expired)
  isTokenValid() {
    if (!this.accessToken) return false;
    if (!this.expiresAt) return true; // If no expiry, assume valid
    return Date.now() < this.expiresAt;
  },

  // Get current tokens
  getTokens() {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      realmId: this.realmId,
      expiresAt: this.expiresAt
    };
  },

  // Set tokens from external source (e.g., frontend localStorage)
  setTokens(tokens) {
    if (tokens.accessToken) this.accessToken = tokens.accessToken;
    if (tokens.refreshToken) this.refreshToken = tokens.refreshToken;
    if (tokens.realmId) this.realmId = tokens.realmId;
    if (tokens.expiresAt) this.expiresAt = tokens.expiresAt;
  }
};

export default tokenStore; 