# Deployment Guide for Vercel

This guide will help you deploy your Vite + Express application with custom token storage to Vercel.

## Prerequisites

1. Vercel account
2. GitHub repository with your code
3. QuickBooks Developer Account
4. OpenAI API Key (if using AI features)

## Step 1: Prepare Your Repository

1. Make sure all your code is committed to GitHub
2. Your project structure should look like this:
   ```
   /
   ├── api/           (Express backend)
   ├── client/        (Vite frontend)
   ├── package.json   (root package.json)
   ├── vercel.json    (Vercel configuration)
   └── .env.example   (Environment variables template)
   ```

## Step 2: Set Up Vercel KV Database

1. Go to your Vercel dashboard
2. Navigate to Storage tab
3. Create a new KV database
4. Note down the connection details (these will be auto-configured)

## Step 3: Deploy to Vercel

### Option A: Deploy from GitHub (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Add your environment variables (see Step 4)
6. Deploy!

### Option B: Deploy from CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Step 4: Configure Environment Variables

In your Vercel project settings, add these environment variables:

### Required Variables:
```
NODE_ENV=production
QB_CLIENT_ID=your_quickbooks_client_id
QB_CLIENT_SECRET=your_quickbooks_client_secret
QB_REDIRECT_URI=https://your-app.vercel.app/api/auth/quickbooks/callback
FRONTEND_URL=https://your-app.vercel.app
OPENAI_API_KEY=your_openai_api_key
```

### Auto-configured by Vercel KV:
```
KV_REST_API_URL=(automatically set when you connect KV database)
KV_REST_API_TOKEN=(automatically set when you connect KV database)
```

## Step 5: Update QuickBooks App Settings

1. Go to your [QuickBooks Developer Dashboard](https://developer.intuit.com/)
2. Edit your app settings
3. Update the Redirect URI to: `https://your-app.vercel.app/api/auth/quickbooks/callback`
4. Replace `your-app` with your actual Vercel app name

## Step 6: Update CORS Settings

The app is already configured to handle production URLs. Make sure to update the CORS origin in `api/index.js` if needed:

```javascript
origin: process.env.NODE_ENV === 'production' 
  ? ['https://your-actual-app.vercel.app'] 
  : ['http://localhost:3000'],
```

## How the Token Storage Works

### Development (Local):
- Uses file-based storage (`tokens.json`)
- Tokens are stored locally on your machine

### Production (Vercel):
- Uses Vercel KV (Redis) for token storage
- Tokens are securely stored in the cloud
- Automatically falls back to file storage if KV is not configured

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vite Frontend │    │  Express API     │    │  Vercel KV      │
│   (Static)      │◄──►│  (Serverless)    │◄──►│  (Token Store)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  QuickBooks API  │
                    └──────────────────┘
```

## Troubleshooting

### Common Issues:

1. **"No valid tokens" error**
   - Check if KV database is connected
   - Verify environment variables are set
   - Re-authenticate with QuickBooks

2. **CORS errors**
   - Update CORS settings in `api/index.js`
   - Check if frontend URL matches in environment variables

3. **OAuth redirect issues**
   - Verify `QB_REDIRECT_URI` matches QuickBooks app settings
   - Check `FRONTEND_URL` environment variable

4. **Build failures**
   - Check that `client/package.json` has `vercel-build` script
   - Verify all dependencies are listed in package.json

### Useful Commands:

```bash
# Check deployment logs
vercel logs

# Redeploy
vercel --prod

# Check environment variables
vercel env list
```

## Development vs Production

### Development:
```bash
# Install dependencies
npm install

# Start both frontend and backend
npm run dev

# Or run separately:
npm run client  # Vite dev server on :3000
npm run server  # Express API on :5000
```

### Production:
- Frontend: Static files served by Vercel CDN
- Backend: Serverless functions on Vercel
- Database: Vercel KV for token storage

## Security Notes

1. Never commit `.env` files to your repository
2. Use environment variables for all sensitive data
3. QuickBooks tokens are automatically refreshed
4. Tokens are encrypted in transit and at rest
5. Vercel KV provides secure, Redis-compatible storage

Your app should now be successfully deployed to Vercel with proper token management!
