export type MessageType = 'text' | 'media';

export interface Contact {
  name?: string;
  phone: string; // raw input, we'll normalize later
  [key: string]: any;
}

export interface MessageData {
  type: MessageType;
  number: string; // when sending direct; for bulk we use Contact.phone
  text?: string;
  media?: string; // url/base64
  mediatype?: 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
  caption?: string;
}

export interface CampaignSettings {
  throttleMs: number; // delay between sends
  retries: number; // per-number retries
  templateId?: string; // selected template id
}

export interface CampaignTemplate {
  id: string;
  name: string;
  type: MessageType;
  text?: string; // supports {{name}} etc
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
  caption?: string;
}

export interface SendLogItem {
  index: number;
  contact: Contact;
  status: 'pending' | 'success' | 'error';
  attempt: number;
  message: string;
  response?: any;
}
