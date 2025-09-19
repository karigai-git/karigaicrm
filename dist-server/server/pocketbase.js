import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();
// Initialize PocketBase with the URL from environment variables
const POCKETBASE_URL = 'https://backend-karigaibackend.7za6uc.easypanel.host';
const POCKETBASE_ADMIN_EMAIL = process.env.VITE_POCKETBASE_ADMIN_EMAIL || 'karigaishree@gmail.com';
const POCKETBASE_ADMIN_PASSWORD = process.env.VITE_POCKETBASE_ADMIN_PASSWORD;
console.log('PocketBase URL:', POCKETBASE_URL);
// Use the token from the working curl command
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc1NDE1NTU0OCwiaWQiOiI1MDRjOXFlODIzMHVjNjgiLCJyZWZyZXNoYWJsZSI6ZmFsc2UsInR5cGUiOiJhdXRoIn0.s_vJH8tdtODJhOIpYluBxALPglNVS6FJxNGT_Qmnnt0';
export const getAuthToken = async () => {
    return AUTH_TOKEN;
};
// Create a WhatsApp activity record
export const createWhatsAppActivity = async (data) => {
    try {
        console.log('Creating WhatsApp activity using direct curl approach');
        console.log('Data received:', JSON.stringify(data));
        // Format data exactly like the working curl command
        const formattedData = {
            order_id: data.order_id, // Pass order ID directly as in curl example
            recipient: data.recipient,
            template_name: data.template_name || '',
            message_content: data.message_content,
            status: data.status,
            timestamp: new Date().toISOString(),
            error_message: data.error_message || ''
        };
        // Add media_url if provided
        if (data.media_url && data.media_url.trim() !== '') {
            formattedData['media_url'] = data.media_url;
        }
        console.log('Sending formatted data to PocketBase:', JSON.stringify(formattedData));
        // Make the API call exactly like the curl command
        const response = await axios.post(`${POCKETBASE_URL}/api/collections/whatsapp_activities/records`, formattedData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });
        console.log('WhatsApp activity created successfully:', response.data);
        return response.data;
    }
    catch (error) {
        console.error('Failed to create WhatsApp activity:', error);
        if (axios.isAxiosError(error) && error.response) {
            console.error('API Error Response:', error.response.data);
        }
        throw error;
    }
};
