// api/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import statusRoutes from './routes/status.js';
import aiRoutes from './routes/ai.js';
// import invoiceRoutes from './routes/invoices.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['http://localhost:5000', 'https://invoice-um37.onrender.com/'] // Add your production domains
      : ['http://localhost:3000', 'http://localhost:5000'],
    methods: ['GET', 'POST'],
    credentials: true,
}));
  
app.use(express.json());
// Serve static files from the React app build
app.use(express.static(path.join(__dirname, '../client/dist')));


// API routes
app.use('/api/auth', authRoutes);
app.use('/api', statusRoutes);
app.use('/api/ai', aiRoutes);
// app.use('/api/invoices', invoiceRoutes);

// Handle React routing, return all non-API requests to React app
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// export const handler = serverless(app);