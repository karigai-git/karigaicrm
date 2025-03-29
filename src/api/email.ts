import express from 'express';
import { sendEmail, sendEmailWithAttachment, checkEmailConnection } from '../server/emailService';
import PocketBase from 'pocketbase';
import axios from 'axios';
import nodemailer from 'nodemailer';
import mg from 'nodemailer-mailgun-transport';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

// Define EmailActivity interface here to avoid import issues
interface EmailActivity {
  id?: string;
  order_id: string;
  template_name: string;
  recipient: string;
  status: 'sent' | 'failed';
  message_content: string;
  timestamp: string;
  subject?: string;
}

const router = express.Router();

// Initialize PocketBase for logging activities
const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || 'https://backend-pocketbase.7za6uc.easypanel.host');

// Ensure admin authentication for PocketBase
async function ensureAdminAuth() {
  try {
    // Check if already authenticated
    if (pb.authStore.isValid) {
      return;
    }
    
    // Authenticate with admin credentials
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com',
      process.env.POCKETBASE_ADMIN_PASSWORD || 'password123'
    );
    
    console.log('Admin authenticated successfully in email API');
  } catch (error) {
    console.error('Error authenticating admin in email API:', error);
    throw error;
  }
}

// Ensure the email_activities collection exists
async function ensureEmailActivitiesCollection() {
  try {
    await ensureAdminAuth();
    const collections = await pb.collections.getFullList();
    const collectionExists = collections.some(c => c.name === 'email_activities');
    
    if (!collectionExists) {
      await pb.collections.create({
        name: 'email_activities',
        schema: [
          {
            name: 'order_id',
            type: 'text',
            required: true,
          },
          {
            name: 'template_name',
            type: 'text',
            required: true,
          },
          {
            name: 'recipient',
            type: 'text',
            required: true,
          },
          {
            name: 'status',
            type: 'text',
            required: true,
          },
          {
            name: 'message_content',
            type: 'text',
            required: true,
          },
          {
            name: 'timestamp',
            type: 'text',
            required: true,
          },
          {
            name: 'subject',
            type: 'text',
          },
        ],
      });
      console.log('Created email_activities collection');
    }
  } catch (error) {
    console.error('Error ensuring email_activities collection:', error);
  }
}

// Log email activity to PocketBase
async function logEmailActivity(activity: EmailActivity) {
  try {
    await ensureAdminAuth();
    await ensureEmailActivitiesCollection();
    await pb.collection('email_activities').create(activity);
    console.log('Email activity logged:', activity);
  } catch (error) {
    console.error('Error logging email activity:', error);
  }
}

// CORS middleware to add headers to all responses
const addCorsHeaders = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Allow requests from any origin
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }
  
  next();
};

// Apply CORS middleware to all routes
router.use(addCorsHeaders);

// Health check endpoint
router.get('/status', async (req, res) => {
  try {
    const status = await checkEmailConnection();
    return res.status(status.connected ? 200 : 500).json(status);
  } catch (error) {
    console.error('Error checking email connection:', error);
    return res.status(500).json({
      connected: false,
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to check email connection'
    });
  }
});

// Send email endpoint
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, message, variables } = req.body;
    
    // Validate required fields
    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email, subject, and message are required'
      });
    }
    
    // Send the email
    const result = await sendEmail(to, subject, message, variables);
    
    // Log the activity if successful
    if (result.success) {
      const activity: EmailActivity = {
        order_id: variables?.orderId || 'N/A',
        template_name: variables?.templateName || 'custom_email',
        recipient: to,
        status: 'sent',
        message_content: message,
        timestamp: new Date().toISOString(),
        subject
      };
      
      await logEmailActivity(activity);
    }
    
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in send-email endpoint:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email'
    });
  }
});

// Send email with attachment endpoint
router.post('/send-email-with-attachment', async (req, res) => {
  try {
    const { to, subject, message, attachments, variables } = req.body;
    
    // Validate required fields
    if (!to || !subject || !message || !attachments || !Array.isArray(attachments)) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email, subject, message, and attachments are required'
      });
    }
    
    // Send the email with attachment
    const result = await sendEmailWithAttachment(to, subject, message, attachments, variables);
    
    // Log the activity if successful
    if (result.success) {
      const activity: EmailActivity = {
        order_id: variables?.orderId || 'N/A',
        template_name: variables?.templateName || 'custom_email_with_attachment',
        recipient: to,
        status: 'sent',
        message_content: message,
        timestamp: new Date().toISOString(),
        subject
      };
      
      await logEmailActivity(activity);
    }
    
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in send-email-with-attachment endpoint:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email with attachment'
    });
  }
});

// Log email activity endpoint
router.post('/log-activity', async (req, res) => {
  try {
    const activity: EmailActivity = req.body;
    
    // Validate required fields
    if (!activity.order_id || !activity.template_name || !activity.recipient || !activity.status || !activity.message_content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for email activity logging'
      });
    }
    
    // Log the activity
    await logEmailActivity(activity);
    
    return res.status(200).json({
      success: true,
      message: 'Email activity logged successfully'
    });
  } catch (error) {
    console.error('Error in log-activity endpoint:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to log email activity'
    });
  }
});

// Check email connection status endpoint
router.get('/connection-status', async (req, res) => {
  try {
    const status = await checkEmailConnection();
    return res.status(200).json(status);
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return res.status(500).json({
      connected: false,
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to check email connection status'
    });
  }
});

// CORS proxy for WhatsApp API connection check
router.get('/check-whatsapp-connection', async (req, res) => {
  try {
    console.log('Server-side WhatsApp connection check requested');
    
    // Get WhatsApp API URL from environment variables
    const whatsAppApiUrl = process.env.WHATSAPP_API_URL || 'https://backend-whatsappapi.7za6uc.easypanel.host';
    console.log('Checking WhatsApp connection at:', whatsAppApiUrl + '/status');
    
    // Make a server-side request to the WhatsApp API
    const response = await axios.get(`${whatsAppApiUrl}/status`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent long waiting times
      timeout: 8000
    });
    
    console.log('WhatsApp connection check successful:', response.data);
    
    // Add CORS headers to the response
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Return the connection status
    return res.status(200).json({
      connected: true,
      status: response.data.status || 'connected',
      message: response.data.message || 'WhatsApp API is connected (via server proxy)'
    });
  } catch (error) {
    console.error('Error in WhatsApp proxy check:', error);
    
    // Add CORS headers even to error responses
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    let errorMessage = 'Failed to connect to WhatsApp API';
    let errorStatus = 'error';
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage = `WhatsApp API error: ${error.response.status} ${error.response.statusText}`;
        errorStatus = 'api_error';
      } else if (error.request) {
        errorMessage = 'No response received from WhatsApp API';
        errorStatus = 'no_response';
      } else {
        errorMessage = error.message;
        errorStatus = 'request_error';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({
      connected: false,
      status: errorStatus,
      message: errorMessage
    });
  }
});

// General purpose WhatsApp API proxy endpoint
router.all('/proxy-whatsapp*', async (req, res) => {
  try {
    console.log('WhatsApp API proxy request:', req.method, req.path);
    
    // Extract the actual path after /proxy-whatsapp
    // This handles both /proxy-whatsapp/path and /proxy-whatsapp endpoints
    const whatsAppPath = req.path.replace(/^\/proxy-whatsapp($|\/)/, '/');
    
    // Get WhatsApp API URL from environment variables
    const whatsAppApiUrl = process.env.WHATSAPP_API_URL || 'https://backend-whatsappapi.7za6uc.easypanel.host';
    const fullUrl = `${whatsAppApiUrl}${whatsAppPath}`;
    
    console.log('Proxying request to:', fullUrl);
    
    // Set CORS headers for all responses
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight request
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    // Make the request to the WhatsApp API
    const options = {
      method: req.method,
      url: fullUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: req.body,
      timeout: 10000
    };
    
    // Forward the request to the WhatsApp API
    const response = await axios(options);
    
    console.log('WhatsApp API response:', {
      status: response.status,
      statusText: response.statusText
    });
    
    // Send back the response from the WhatsApp API
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error in WhatsApp API proxy:', error);
    
    // Add CORS headers even to error responses
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Extract error details and return a meaningful response
    if (axios.isAxiosError(error)) {
      // If the WhatsApp API returned an error
      if (error.response) {
        return res.status(error.response.status).json({
          success: false,
          message: `WhatsApp API error: ${error.response.status} ${error.response.statusText}`,
          data: error.response.data
        });
      } else if (error.request) {
        // If the request was made but no response was received
        return res.status(502).json({
          success: false,
          message: 'No response from WhatsApp API. The server may be down or unreachable.'
        });
      } else {
        // If there was an error setting up the request
        return res.status(500).json({
          success: false,
          message: `Error setting up request: ${error.message}`
        });
      }
    } else if (error instanceof Error) {
      // For other types of errors
      return res.status(500).json({
        success: false,
        message: error.message
      });
    } else {
      // For unknown errors
      return res.status(500).json({
        success: false,
        message: 'An unknown error occurred'
      });
    }
  }
});

// Direct WhatsApp sending endpoint using curl
router.post('/direct-whatsapp-send', async (req, res) => {
  try {
    console.log('Direct WhatsApp send request received:', req.method);
    
    // Get WhatsApp API URL from environment variables
    const whatsAppApiUrl = process.env.WHATSAPP_API_URL || 'https://backend-whatsappapi.7za6uc.easypanel.host';
    
    // Extract data from request
    const { to, message, type = 'text', mediaUrl, caption, filename } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: to and message are required'
      });
    }
    
    // Determine endpoint based on message type
    let endpoint = '';
    switch (type) {
      case 'text':
        endpoint = `${whatsAppApiUrl}/send-message`;
        break;
      case 'image':
        endpoint = `${whatsAppApiUrl}/send-image-url`;
        break;
      case 'video':
        endpoint = `${whatsAppApiUrl}/send-video-url`;
        break;
      case 'document':
        endpoint = `${whatsAppApiUrl}/send-document-url`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Invalid message type: ${type}`
        });
    }
    
    // Build curl command
    let curlCmd = `curl -X POST ${endpoint} -H "Content-Type: application/json" -d '`;
    
    // Build data payload based on message type
    let payload: Record<string, any> = {};
    
    if (type === 'text') {
      payload = {
        number: to,
        message: message
      };
    } else if (type === 'image') {
      payload = {
        number: to,
        imageUrl: mediaUrl,
        caption: caption || ''
      };
    } else if (type === 'video') {
      payload = {
        number: to,
        videoUrl: mediaUrl,
        caption: caption || ''
      };
    } else if (type === 'document') {
      payload = {
        number: to,
        documentUrl: mediaUrl,
        filename: filename || 'document.pdf',
        caption: caption || ''
      };
    }
    
    // Add the JSON payload to the curl command
    curlCmd += JSON.stringify(payload) + "'";
    
    console.log('Executing curl command:', curlCmd.replace(/'/g, '"')); // Log sanitized version
    
    // Execute the curl command
    const execPromise = promisify(exec);
    const { stdout, stderr } = await execPromise(curlCmd);
    
    if (stderr) {
      console.error('Curl command error:', stderr);
    }
    
    console.log('Curl command response:', stdout);
    
    // Parse the response
    let responseData;
    try {
      responseData = JSON.parse(stdout);
    } catch (error) {
      console.error('Error parsing curl response:', error);
      responseData = { raw: stdout };
    }
    
    // Return the response
    return res.status(200).json({
      success: true,
      message: `WhatsApp ${type} message sent successfully via curl`,
      ...responseData
    });
  } catch (error) {
    console.error('Error in direct WhatsApp send:', error);
    
    // Add CORS headers even to error responses
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

export default router;
