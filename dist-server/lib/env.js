import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();
// Define a function to get environment variables with a fallback
export function getEnv(key, defaultValue = '') {
    return process.env[key] || defaultValue;
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
