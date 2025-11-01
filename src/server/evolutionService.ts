import { Router } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { createWhatsAppActivity } from './pocketbase';

dotenv.config();

const router = Router();

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

// Send text message
router.post('/messages', async (req, res) => {
  const { phone, message, orderId, templateName } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and message are required' });
  }

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return res.status(500).json({ error: 'Evolution API credentials are not configured' });
  }

  try {
    // Get instance name from environment or use default
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'karigai';
    
    console.log(`Sending message to ${phone} via Evolution API instance: ${instanceName}`);
    
    const response = await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
      {
        number: phone,
        text: message,
        options: {
          delay: 1200,
          presence: 'composing',
          linkPreview: true
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        timeout: 15000,
      }
    );

    // Create a WhatsApp activity record in PocketBase for text messages
    try {
      console.log(`Recording WhatsApp activity with orderId: ${orderId}`);
      // Log the exact order ID value for debugging
      console.log('Order ID value:', orderId, 'Type:', typeof orderId);
      
      await createWhatsAppActivity({
        order_id: orderId || '', // Pass order ID as a simple string
        recipient: phone,
        template_name: templateName || '',
        message_content: message,
        status: 'sent',
        error_message: ''
      });
      console.log('WhatsApp text message activity recorded successfully');
    } catch (activityError) {
      console.error('Failed to record WhatsApp activity:', activityError);
      // Continue with the response even if activity recording fails
    }

    res.status(200).json(response.data);
  } catch (error: any) {
    const status = error?.response?.status || error?.output?.statusCode || 500;
    const payload = error?.response?.data || error?.output?.payload || { error: 'Failed to send message' };
    console.error('Error sending message via Evolution API:', {
      status,
      payload,
      message: error?.message,
    });
    
    // Record the failed message attempt
    try {
      console.log(`Recording failed WhatsApp activity with orderId: ${orderId}`);
      // Log the exact order ID value for debugging
      console.log('Order ID value:', orderId, 'Type:', typeof orderId);
      
      await createWhatsAppActivity({
        order_id: orderId || '', // Pass order ID as a simple string
        recipient: phone,
        template_name: templateName || '',
        message_content: message,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('Failed WhatsApp message activity recorded');
    } catch (activityError) {
      console.error('Failed to record failed WhatsApp activity:', activityError);
      // Continue with the error response even if activity recording fails
    }
    
    // Map Evolution timeout (often means instance disconnected or number check timed out)
    if (status === 408) {
      return res.status(408).json({ error: 'Evolution API timed out. Instance may be disconnected or unreachable.' });
    }
    res.status(status).json(typeof payload === 'object' ? payload : { error: String(payload) });
  }
});

// Send media message (image, document, etc)
router.post('/media', async (req, res) => {
  const { phone, caption, mediaUrl, mediaType, fileName, orderId } = req.body;

  if (!phone || !mediaUrl) {
    return res.status(400).json({ error: 'Phone and mediaUrl are required' });
  }

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return res.status(500).json({ error: 'Evolution API credentials are not configured' });
  }

  try {
    // Get instance name from environment or use default
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'karigai';
    
    console.log(`Sending media to ${phone} via Evolution API instance: ${instanceName}`);
    console.log(`Media URL: ${mediaUrl}`);
    
    const response = await axios.post(
      `${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`,
      {
        number: phone,
        options: {
          // Evolution expects media options here
          // See: https://evolution-api.com/docs/message/sendMedia
          // We pass caption and filename as part of options
          mimetype: mediaType || 'image/jpeg',
          fileName: fileName || 'product-image.jpg',
          caption: caption || '',
          media: mediaUrl
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        timeout: 20000,
      }
    );

    // Create a WhatsApp activity record in PocketBase for media messages
    try {
      console.log(`Recording WhatsApp media activity with orderId: ${orderId}`);
      // Log the exact order ID value for debugging
      console.log('Order ID value:', orderId, 'Type:', typeof orderId);
      
      await createWhatsAppActivity({
        order_id: orderId || '', // Pass order ID as a simple string
        recipient: phone,
        template_name: '',
        message_content: caption || 'Media message',
        status: 'sent',
        error_message: '',
        media_url: mediaUrl
      });
      console.log('WhatsApp media message activity recorded successfully');
    } catch (activityError) {
      console.error('Failed to record WhatsApp media activity:', activityError);
      // Continue with the response even if activity recording fails
    }

    res.status(200).json(response.data);
  } catch (error: any) {
    const status = error?.response?.status || error?.output?.statusCode || 500;
    const payload = error?.response?.data || error?.output?.payload || { error: 'Failed to send media' };
    console.error('Error sending media via Evolution API:', {
      status,
      payload,
      message: error?.message,
    });
    
    // Record the failed media message attempt
    try {
      console.log(`Recording failed WhatsApp media activity with orderId: ${orderId}`);
      // Log the exact order ID value for debugging
      console.log('Order ID value:', orderId, 'Type:', typeof orderId);
      
      await createWhatsAppActivity({
        order_id: orderId || '', // Pass order ID as a simple string
        recipient: phone,
        template_name: '',
        message_content: caption || 'Media message',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        media_url: mediaUrl
      });
      console.log('Failed WhatsApp media message activity recorded');
    } catch (activityError) {
      console.error('Failed to record failed WhatsApp media activity:', activityError);
      // Continue with the error response even if activity recording fails
    }
    
    if (status === 408) {
      return res.status(408).json({ error: 'Evolution API timed out. Instance may be disconnected or unreachable.' });
    }
    res.status(status).json(typeof payload === 'object' ? payload : { error: String(payload) });
  }
});

// Get instance connection state
router.get('/instance/connection/:instanceName', async (req, res) => {
  const { instanceName } = req.params;

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return res.status(500).json({ error: 'Evolution API credentials are not configured' });
  }

  try {
    console.log(`Checking connection state for instance: ${instanceName}`);
    const response = await axios.get(
      `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
      {
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching instance connection state:', error);
    res.status(500).json({ error: 'Failed to fetch instance connection state' });
  }
});

// Get QR code for instance connection
router.get('/instance/connect/:instanceName', async (req, res) => {
  const { instanceName } = req.params;

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return res.status(500).json({ error: 'Evolution API credentials are not configured' });
  }

  try {
    console.log(`Connecting instance: ${instanceName}`);
    // This endpoint generates a QR code for connecting the instance
    const response = await axios.get(
      `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
      {
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
        // If the QR is an image, you might need responseType: 'arraybuffer'
      }
    );
    // Depending on the API's response, you might need to handle it differently
    // For now, we assume it returns JSON with QR data
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error connecting instance:', error);
    res.status(500).json({ error: 'Failed to connect instance' });
  }
});

export default router;

