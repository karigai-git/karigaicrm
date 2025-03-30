import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import emailRoutes from '../api/email';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { SERVER_ENV } from '../lib/env';
import { checkWhatsAppStatus, sendWhatsAppMessage, sendWhatsAppTemplate } from '../lib/whatsapp-direct';
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
// WhatsApp API Routes - using direct curl implementation
app.get('/whatsapp-api/status', async (req, res) => {
    try {
        const result = await checkWhatsAppStatus();
        res.json(result);
    }
    catch (error) {
        console.error('Error in WhatsApp status endpoint:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/whatsapp-api/send-message', async (req, res) => {
    try {
        const { number, message, variables } = req.body;
        if (!number || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }
        console.log('WhatsApp message request received:', { number, message });
        const result = await sendWhatsAppMessage(number, message, variables);
        // Log the API result
        console.log('Direct WhatsApp API result:', result);
        res.json(result);
    }
    catch (error) {
        console.error('Error in WhatsApp send-message endpoint:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/whatsapp-api/send-template', async (req, res) => {
    try {
        const { number, template_name, components } = req.body;
        if (!number || !template_name) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and template name are required'
            });
        }
        console.log('WhatsApp template request received:', { number, template_name });
        const result = await sendWhatsAppTemplate(number, template_name, components);
        // Log the API result
        console.log('Direct WhatsApp API template result:', result);
        res.json(result);
    }
    catch (error) {
        console.error('Error in WhatsApp send-template endpoint:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
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
