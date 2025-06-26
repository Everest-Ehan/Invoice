// api/quickbooks/vercelTokenStore.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TOKEN_KEY = 'quickbooks_tokens';

const tokenStore = {
  async getTokens() {
    return (await redis.get(TOKEN_KEY)) || {};
  },
  async setTokens(tokens) {
    await redis.set(TOKEN_KEY, tokens);
  },
  async clearTokens() {
    await redis.del(TOKEN_KEY);
  },
  async isTokenValid() {
    const tokens = await this.getTokens();
    return tokens.accessToken && tokens.expiresAt && Date.now() < Number(tokens.expiresAt);
  },
  async saveTokens(accessToken, refreshToken, realmId, expiresIn) {
    const expiresAt = Date.now() + expiresIn * 1000;
    await this.setTokens({ accessToken, refreshToken, realmId, expiresAt });
  },
};

export default tokenStore;
