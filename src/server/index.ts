import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';
import emailRoutes from '../api/email';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { writeFileSync } from 'fs';

// Handle ESM in TypeScript
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const DEFAULT_PORT = parseInt(process.env.SERVER_PORT || '3001', 10);
const ALTERNATIVE_PORTS = [3002, 3003, 3004, 4001, 4002, 4003];

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/email', emailRoutes);

// WhatsApp API proxy
const WHATSAPP_API_TARGET = process.env.VITE_WHATSAPP_API_URL || 'https://crm-v1.7za6uc.easypanel.host/whatsapp-api';

// Log the SMTP configuration for debugging
console.log('SMTP Configuration:', {
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
  port: process.env.SMTP_PORT || process.env.EMAIL_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || process.env.EMAIL_USER
});

// Log the WhatsApp API target for debugging
console.log('WhatsApp API Target:', WHATSAPP_API_TARGET);

// Create WhatsApp API proxy middleware
app.use('/whatsapp-api', async (req, res) => {
  try {
    // Get the target API URL from environment or use default
    const apiTarget = WHATSAPP_API_TARGET.endsWith('/') 
      ? WHATSAPP_API_TARGET.slice(0, -1) 
      : WHATSAPP_API_TARGET;
      
    // Build the target URL
    const targetUrl = `${apiTarget}${req.url}`;
    console.log(`Proxying WhatsApp API request to: ${targetUrl}`);
    
    // Forward the request to the WhatsApp API
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.method !== 'GET' ? req.body : undefined,
      headers: {
        'Content-Type': 'application/json',
        // Forward other necessary headers
        ...req.headers as Record<string, string>,
        // Remove host header to avoid conflicts
        host: undefined,
      },
      validateStatus: () => true, // Always resolve to handle errors ourselves
    });
    
    // Send back the API response
    res.status(response.status).json(response.data);
    console.log(`WhatsApp API proxy response status: ${response.status}`);
  } catch (error) {
    console.error('WhatsApp API proxy error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error proxying request to WhatsApp API',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Server port info endpoint
app.get('/port-info', (req, res) => {
  const address = server.address();
  let port = 0;
  
  if (typeof address === 'object' && address !== null) {
    port = address.port;
  }
  
  res.status(200).json({ port });
});

// Create HTTP server
const server = createServer(app);

// Function to save port information to a file
const savePortInfo = (port: number) => {
  try {
    const portInfoPath = join(process.cwd(), 'port-info.json');
    writeFileSync(portInfoPath, JSON.stringify({ port }));
    console.log(`Port information saved to ${portInfoPath}`);
  } catch (err) {
    console.error('Failed to save port information:', err);
  }
};

// Function to attempt starting the server on a given port
const startServer = (port: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use, trying another port...`);
        reject(err);
      } else {
        reject(err);
      }
    });
    
    server.once('listening', () => {
      console.log(`Email server running on port ${port}`);
      // Save port information for the frontend to use
      savePortInfo(port);
      resolve(port);
    });
    
    server.listen(port);
  });
};

// Try to start the server on the default port, then fallback to alternatives
const tryPorts = async () => {
  try {
    // First try the default port
    await startServer(DEFAULT_PORT);
  } catch (err) {
    // If default port fails, try alternatives
    let started = false;
    
    for (const port of ALTERNATIVE_PORTS) {
      try {
        await startServer(port);
        started = true;
        break;
      } catch (err) {
        console.log(`Port ${port} also failed, trying next...`);
      }
    }
    
    if (!started) {
      console.error('Failed to start server on any port');
      process.exit(1);
    }
  }
};

// Start the server
tryPorts();

export default app;
