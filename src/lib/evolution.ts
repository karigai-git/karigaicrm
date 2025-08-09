export interface SendMessageRequest {
  phone: string;
  message: string;
  orderId: string;
  templateName?: string;
}

export interface SendMediaMessageRequest {
  phone: string;
  mediaUrl: string;
  caption?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
  orderId?: string;
}
// Backend URL discovery
// 1) Use VITE_SERVER_URL if provided
// 2) Otherwise probe common ports (server writes its chosen port via port fallback)
const ENV_SERVER_URL = (import.meta as any)?.env?.VITE_SERVER_URL as string | undefined;
const ENV_SERVER_PORT = Number((import.meta as any)?.env?.VITE_SERVER_PORT) || 3001;
const CANDIDATE_PORTS = [ENV_SERVER_PORT, 3002, 3003, 4001, 4002, 4003];

let RESOLVED_SERVER_URL: string | null = ENV_SERVER_URL || null;

const fetchWithTimeout = async (url: string, ms = 1200) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'cache-control': 'no-cache' } });
    return res;
  } finally {
    clearTimeout(id);
  }
};

const resolveServerUrl = async (): Promise<string> => {
  if (RESOLVED_SERVER_URL) return RESOLVED_SERVER_URL;
  // Try candidates: http://localhost:<port>
  for (const port of CANDIDATE_PORTS) {
    const base = `http://localhost:${port}`;
    try {
      const res = await fetchWithTimeout(`${base}/health`, 1000);
      if (res.ok) {
        RESOLVED_SERVER_URL = base;
        console.log('Detected backend URL:', RESOLVED_SERVER_URL);
        return base;
      }
    } catch {
      // try next
    }
  }
  // Last attempt: if vite dev server proxies, allow relative root
  RESOLVED_SERVER_URL = '';
  return '';
};

/**
 * Formats a phone number to ensure it has the 91 country code prefix
 * @param phone The phone number to format
 * @returns Formatted phone number with 91 prefix if needed
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it's exactly 10 digits, add 91 prefix
  if (digits.length === 10) {
    return `91${digits}`;
  }
  
  // If it already has country code (91) or other format, leave as is
  return digits;
};

export const sendWhatsAppMessage = async (data: SendMessageRequest) => {
  try {
    // Format the phone number to ensure it has 91 country code
    const formattedPhone = formatPhoneNumber(data.phone);
    
    const requestData = {
      ...data,
      phone: formattedPhone
    };
    
    const base = await resolveServerUrl();
    console.log('Sending WhatsApp message via backend proxy:', requestData);
    console.log('Backend URL:', `${base}/api/evolution/messages`);
    
    // Add timestamp for debugging
    console.time('whatsapp-message-request');
    
    const response = await fetch(`${base}/api/evolution/messages`, {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.timeEnd('whatsapp-message-request');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API Error: ${response.status}`);
      } catch (e) {
        throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    }

    const result = await response.json();
    console.log('Message sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

export const sendWhatsAppMediaMessage = async (data: SendMediaMessageRequest) => {
  try {
    // Format the phone number to ensure it has 91 country code
    const formattedPhone = formatPhoneNumber(data.phone);
    
    const requestData = {
      ...data,
      phone: formattedPhone
    };
    
    const base = await resolveServerUrl();
    console.log('Sending WhatsApp media message via backend proxy:', requestData);
    console.log('Backend URL:', `${base}/api/evolution/media`);
    
    // Add timestamp for debugging
    console.time('whatsapp-media-request');
    
    const response = await fetch(`${base}/api/evolution/media`, {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.timeEnd('whatsapp-media-request');
    
    if (!response.ok) {
      throw new Error(`Failed to send media message: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('WhatsApp media message sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp media message:', error);
    throw error;
  }
};

export const getInstanceConnectionState = async (instanceName: string) => {
  try {
    console.log(`Fetching connection state for instance: ${instanceName}`);
    const base = await resolveServerUrl();
    const response = await fetch(`${base}/api/evolution/instance/connection/${instanceName}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch connection state: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching instance connection state:', error);
    throw error;
  }
};

export const connectInstance = async (instanceName: string) => {
  try {
    console.log(`Connecting instance: ${instanceName}`);
    const base = await resolveServerUrl();
    const response = await fetch(`${base}/api/evolution/instance/connect/${instanceName}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to connect instance: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Connect instance response:', data);
    return data;
  } catch (error) {
    console.error('Error connecting instance:', error);
    throw error;
  }
};
