import { checkWhatsAppConnection, sendWhatsAppTextMessage } from './whatsapp';

/**
 * Test script to verify WhatsApp API configuration
 */
async function testWhatsAppAPI() {
  console.log('Testing WhatsApp API configuration...');
  console.log('Environment:', import.meta.env.MODE);
  console.log('WhatsApp API URL (if set in env):', import.meta.env.VITE_WHATSAPP_API_URL);
  
  try {
    // Check connection
    console.log('Checking WhatsApp API connection...');
    const connectionStatus = await checkWhatsAppConnection();
    console.log('Connection status:', connectionStatus);
    
    if (connectionStatus.connected) {
      // If connected, try sending a test message
      console.log('Attempting to send a test message...');
      const testPhone = '919941569662'; // Replace with your test number
      const testMessage = 'Test message from Konipai CRM - ' + new Date().toISOString();
      
      const result = await sendWhatsAppTextMessage(testPhone, testMessage);
      console.log('Send message result:', result);
      
      if (result.success) {
        console.log('✅ WhatsApp API is properly configured!');
      } else {
        console.log('❌ WhatsApp API message sending failed:', result.message);
      }
    } else {
      console.log('❌ WhatsApp API connection failed:', connectionStatus.message);
    }
  } catch (error) {
    console.error('❌ Error testing WhatsApp API:', error);
  }
}

// Run the test function
testWhatsAppAPI().catch(console.error);

export default testWhatsAppAPI; 