import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log(`Found .env at ${envPath}`);
    dotenv.config({ path: envPath });
  } else {
    console.log('No .env file found in current directory');
    
    // Create default .env for server if needed
    const defaultEnv = `
SERVER_PORT=3000
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=support@konipai.in
EMAIL_PASSWORD=Bharu@2399
EMAIL_FROM=support@konipai.in
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=support@konipai.in
SMTP_PASSWORD=Bharu@2399
POCKETBASE_ADMIN_EMAIL=nnirmal7107@gmail.com
POCKETBASE_ADMIN_PASSWORD=Kamala@7107
VITE_POCKETBASE_URL=https://backend-pocketbase.7za6uc.easypanel.host/
`;
    fs.writeFileSync('.env', defaultEnv);
    dotenv.config();
  }
} catch (error) {
  console.error('Error loading environment:', error);
}

// Server configuration
export const serverConfig = {
  port: process.env.SERVER_PORT || 3000,
  cors: {
    origin: '*', // Configure as needed for production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  email: {
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: process.env.EMAIL_PORT || process.env.SMTP_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USER || 'support@konipai.in',
      pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD || ''
    },
    from: process.env.EMAIL_FROM || 'support@konipai.in'
  },
  pocketbase: {
    url: process.env.VITE_POCKETBASE_URL || 'https://backend-pocketbase.7za6uc.easypanel.host/',
    adminEmail: process.env.POCKETBASE_ADMIN_EMAIL || 'nnirmal7107@gmail.com',
    adminPassword: process.env.POCKETBASE_ADMIN_PASSWORD || 'Kamala@7107'
  }
};

// Helper for Express app setup
export function createServerApp() {
  const app = express();
  
  // Middleware
  app.use(cors(serverConfig.cors));
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));
  
  return app;
}

// Print server configuration (without sensitive info)
export function logServerConfig() {
  console.log('Server configuration:');
  console.log('- Port:', serverConfig.port);
  console.log('- Email host:', serverConfig.email.host);
  console.log('- Email port:', serverConfig.email.port);
  console.log('- PocketBase URL:', serverConfig.pocketbase.url);
} 