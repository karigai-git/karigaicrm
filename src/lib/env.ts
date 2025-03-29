import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// In browser environment, we don't need to load .env file as Vite handles it
// Only run dotenv in Node.js environment
if (typeof process !== 'undefined' && process.env) {
  dotenv.config();
}

// Define a function to get environment variables with a fallback
export function getEnv(key: string, defaultValue: string = ''): string {
  // Check if we're in browser or Node environment
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Browser environment (Vite)
    return (import.meta.env[key] as string) || defaultValue;
  } else if (typeof process !== 'undefined' && process.env) {
    // Node.js environment
    return process.env[key] || defaultValue;
  }
  // Fallback if neither is available
  return defaultValue;
}

// Server-side environment variables
export const SERVER_ENV = {
  VITE_API_URL: getEnv('VITE_API_URL', ''),
  VITE_EMAIL_API_URL: getEnv('VITE_EMAIL_API_URL', ''),
  VITE_GEMINI_API_KEY: getEnv('VITE_GEMINI_API_KEY', ''),
  VITE_POCKETBASE_URL: getEnv('VITE_POCKETBASE_URL', ''),
  POCKETBASE_ADMIN_EMAIL: getEnv('POCKETBASE_ADMIN_EMAIL', 'nnirmal7107@gmail.com'),
  POCKETBASE_ADMIN_PASSWORD: getEnv('POCKETBASE_ADMIN_PASSWORD', 'Kamala@7107'),
  VITE_WHATSAPP_API_URL: getEnv('VITE_WHATSAPP_API_URL', '')
};