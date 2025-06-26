// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import statusRoutes from './routes/status.js';
import aiRoutes from './routes/ai.js';
// import invoiceRoutes from './routes/invoices.js';

dotenv.config();

const app = express();
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  }));
  
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', statusRoutes);
app.use('/api/ai', aiRoutes);
// app.use('/api/invoices', invoiceRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));