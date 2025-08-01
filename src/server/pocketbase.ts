import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Initialize PocketBase with the URL from environment variables
const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'https://backend-karigaibackend.7za6uc.easypanel.host';
const POCKETBASE_ADMIN_EMAIL = process.env.VITE_POCKETBASE_ADMIN_EMAIL || 'karigaishree@gmail.com';
const POCKETBASE_ADMIN_PASSWORD = process.env.VITE_POCKETBASE_ADMIN_PASSWORD;

console.log('PocketBase URL:', POCKETBASE_URL);

// Use the working token from the curl command
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc1NDE1NTU0OCwiaWQiOiI1MDRjOXFlODIzMHVjNjgiLCJyZWZyZXNoYWJsZSI6ZmFsc2UsInR5cGUiOiJhdXRoIn0.s_vJH8tdtODJhOIpYluBxALPglNVS6FJxNGT_Qmnnt0';

export const getAuthToken = async () => {
  return AUTH_TOKEN;
};

// Create a WhatsApp activity record
export const createWhatsAppActivity = async (data: {
  order_id: string;
  recipient: string;
  template_name?: string;
  message_content: string;
  status: string;
  error_message?: string;
  media_url?: string;
}) => {
  try {
    console.log('Attempting to create WhatsApp activity with data:', JSON.stringify(data));
    
    // Log the incoming data for debugging
    console.log('Creating WhatsApp activity with raw data:', JSON.stringify(data));
    
    // Format data according to PocketBase API documentation
    const formattedData: Record<string, any> = {
      recipient: data.recipient,
      template_name: data.template_name || '',
      message_content: data.message_content,
      status: data.status,
      error_message: data.error_message || '',
      timestamp: new Date().toISOString(),
    };
    
    // Handle order_id relation field
    if (data.order_id && data.order_id.trim() !== '') {
      // For relation fields in PocketBase, we can pass the ID directly
      formattedData.order_id = data.order_id;
      console.log(`Setting order_id relation to: "${data.order_id}"`);  
    }
    
    // Add media_url if provided
    if (data.media_url) {
      formattedData['media_url'] = data.media_url;
    }

    console.log('Creating record in whatsapp_activities collection with formatted data:', JSON.stringify(formattedData));
    
    // Use direct HTTP request with the working token
    // Add ?expand=0 to prevent PocketBase from trying to expand relations
    const response = await axios.post(
      `${POCKETBASE_URL}/api/collections/whatsapp_activities/records?expand=0`,
      formattedData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    console.log('WhatsApp activity recorded successfully:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('Failed to record WhatsApp activity:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    return null;
  }
};
