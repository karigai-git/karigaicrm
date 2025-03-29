import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import emailRoutes from '../api/email';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// Handle ESM in TypeScript
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment variables
dotenv.config();
const app = express();
const PORT = process.env.SERVER_PORT || 3001;
// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
// Routes
app.use('/api/email', emailRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Start the server
app.listen(PORT, () => {
    console.log(`Email server running on port ${PORT}`);
});
export default app;
