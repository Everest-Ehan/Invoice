# Invoice Management App

A modern invoice management application built with React (Vite) frontend and Express backend, integrated with QuickBooks Online and AI-powered chat assistance.

## Features

- 🔗 QuickBooks Online Integration
- 🤖 AI-Powered Invoice Assistant
- 💾 Secure Token Management
- 📱 Responsive Design
- ☁️ Cloud-Ready Deployment

## Tech Stack

### Frontend
- React 19
- Vite
- Modern ES modules

### Backend
- Express.js
- Node.js
- QuickBooks Node SDK
- OpenAI Integration

### Storage
- Local: File-based token storage
- Production: Vercel KV (Redis)

### Deployment
- Frontend: Vercel static hosting
- Backend: Vercel serverless functions

## Quick Start

### Development

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd invoice-app
   npm install
   ```

2. **Set up Environment Variables**
   ```bash
   cp .env.example .env
   # Fill in your API keys and configuration
   ```

3. **Start Development Servers**
   ```bash
   npm run dev
   ```
   This starts both frontend (port 3000) and backend (port 5000)

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Vercel deployment instructions.

## Environment Variables

Required for both development and production:

```env
QB_CLIENT_ID=your_quickbooks_client_id
QB_CLIENT_SECRET=your_quickbooks_client_secret
QB_REDIRECT_URI=your_callback_url
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=your_frontend_url
```

## Project Structure

```
├── api/                    # Express backend
│   ├── index.js           # Main server file
│   ├── routes/            # API routes
│   ├── quickbooks/        # QB integration & token management
│   └── tools/             # AI tools for invoice operations
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx        # Main app component
│   └── package.json
├── vercel.json            # Vercel deployment config
└── package.json           # Root package.json
```

## Key Features

### Secure Token Management
- **Development**: File-based storage (`tokens.json`)
- **Production**: Vercel KV (Redis) with automatic failover
- Automatic token refresh
- Secure OAuth flow

### QuickBooks Integration
- Full OAuth 2.0 implementation
- Invoice CRUD operations
- Customer management
- Real-time data sync

### AI Assistant
- Natural language invoice queries
- Automated invoice creation
- Smart data analysis
- OpenAI GPT integration

## API Endpoints

### Authentication
- `GET /api/auth/quickbooks` - Start OAuth flow
- `GET /api/auth/quickbooks/callback` - OAuth callback
- `GET /api/auth/validate-token` - Validate current token
- `POST /api/auth/refresh-token` - Refresh expired token
- `GET /api/auth/logout` - Clear tokens

### AI Chat
- `POST /api/ai/chat` - Send message to AI assistant

### Status
- `GET /api/status` - Health check

## Development Scripts

```bash
npm run dev          # Start both frontend and backend
npm run client       # Start only frontend (Vite)
npm run server       # Start only backend (Express)
```

## Production Considerations

1. **Token Storage**: Automatically uses Vercel KV in production
2. **CORS**: Configured for both development and production domains
3. **Environment**: Uses `NODE_ENV` to switch between configurations
4. **Security**: All sensitive data stored in environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For deployment issues, see [DEPLOYMENT.md](./DEPLOYMENT.md)
For QuickBooks API questions, check the [QuickBooks Developer Docs](https://developer.intuit.com/)
