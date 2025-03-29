import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import emailRoutes from '../api/email';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { SERVER_ENV } from '../lib/env';

// Handle ESM in TypeScript
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// API Routes
app.get('/api', (req, res) => {
  res.json({ status: 'API is running' });
});

// Email API Routes
app.use('/email-api', emailRoutes);

// WhatsApp API Routes - to be implemented or imported
app.get('/whatsapp-api', (req, res) => {
  res.json({ status: 'WhatsApp API endpoint is set up' });
});

app.post('/whatsapp-api/send-message', (req, res) => {
  console.log('WhatsApp message request received:', req.body);
  res.json({ 
    success: true, 
    message: 'WhatsApp endpoint configured correctly',
    messageId: 'test-message-id-' + Date.now()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('API URL:', SERVER_ENV.VITE_API_URL);
  console.log('Email API URL:', SERVER_ENV.VITE_EMAIL_API_URL);
  console.log('WhatsApp API URL:', SERVER_ENV.VITE_WHATSAPP_API_URL);
});

export default app;
