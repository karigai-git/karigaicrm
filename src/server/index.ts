import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import emailRoutes from '../api/email';
import evolutionRoutes from './evolutionService';
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

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Request started`);
  
  // Log request body for POST/PUT requests
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    console.log('Request body:', JSON.stringify(req.body));
  }
  
  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Response sent in ${duration}ms with status ${res.statusCode}`);
    return originalSend.call(this, body);
  };
  
  next();
});

// Routes
app.use('/api/email', emailRoutes);
app.use('/api/evolution', evolutionRoutes);

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
