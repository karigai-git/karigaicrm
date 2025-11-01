/**
 * TypeScript declarations for WhatsApp API endpoints
 */

/**
 * WhatsApp API Status Response
 */
interface WhatsAppStatusResponse {
  status: string;
  message: string;
  version?: string;
  uptime?: number;
}

/**
 * WhatsApp API Send Message Request
 */
interface SendMessageRequest {
  number: string; // Phone number with country code
  message: string; // Message text content
  variables?: Record<string, string>; // Template variables if using templates
}

/**
 * WhatsApp API Send Image Request
 */
interface SendImageRequest {
  number: string; // Phone number with country code
  imageUrl: string; // URL of the image to send
  caption?: string; // Optional caption for the image
  variables?: Record<string, string>; // Template variables if using templates
}

/**
 * WhatsApp API Send Document Request
 */
interface SendDocumentRequest {
  number: string; // Phone number with country code
  documentUrl: string; // URL of the document to send
  filename: string; // Filename for the document
  caption?: string; // Optional caption for the document
  variables?: Record<string, string>; // Template variables if using templates
}

/**
 * WhatsApp API Send Video Request
 */
interface SendVideoRequest {
  number: string; // Phone number with country code
  videoUrl: string; // URL of the video to send
  caption?: string; // Optional caption for the video
  variables?: Record<string, string>; // Template variables if using templates
}

/**
 * WhatsApp API Response
 */
interface WhatsAppApiResponse {
  success: boolean;
  message: string;
  messageId?: string;
  id?: string;
  status?: string;
  timestamp?: string;
}

/**
 * WhatsApp API Endpoints
 */
interface WhatsAppApiEndpoints {
  /** Check the API status */
  '/status': {
    GET: {
      response: WhatsAppStatusResponse;
    };
  };
  
  /** Send a text message */
  '/send-message': {
    POST: {
      request: SendMessageRequest;
      response: WhatsAppApiResponse;
    };
  };
  
  /** Send an image */
  '/send-image-url': {
    POST: {
      request: SendImageRequest;
      response: WhatsAppApiResponse;
    };
  };
  
  /** Send a document */
  '/send-document-url': {
    POST: {
      request: SendDocumentRequest;
      response: WhatsAppApiResponse;
    };
  };
  
  /** Send a video */
  '/send-video-url': {
    POST: {
      request: SendVideoRequest;
      response: WhatsAppApiResponse;
    };
  };
} 