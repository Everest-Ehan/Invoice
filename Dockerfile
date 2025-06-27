# Multi-stage Dockerfile for Invoice App
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY api/package*.json ./api/
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force
RUN cd api && npm ci --only=production && npm cache clean --force
RUN cd client && npm ci --only=production && npm cache clean --force

# Build the client
FROM base AS client-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY client/package*.json ./client/
COPY client/ ./client/
WORKDIR /app/client
RUN npm ci
RUN npm run build

# Build the API
FROM base AS api-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY api/package*.json ./api/
COPY api/ ./api/
WORKDIR /app/api
RUN npm ci

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built client
COPY --from=client-builder --chown=nextjs:nodejs /app/client/dist ./client/dist

# Copy API
COPY --from=api-builder --chown=nextjs:nodejs /app/api ./api
COPY --from=deps /app/api/node_modules ./api/node_modules

# Copy root dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy environment file template
# COPY .env.example .env

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/status', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "api/index.js"] 