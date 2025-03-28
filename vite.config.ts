import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get WhatsApp API URL from .env or use default
  const whatsAppApiUrl = env.WHATSAPP_API_URL || 'https://backend-whatsappapi.7za6uc.easypanel.host';
  
  console.log(`Configuring WhatsApp API proxy with target: ${whatsAppApiUrl}`);
  
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/whatsapp-api': {
          target: whatsAppApiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/whatsapp-api/, ''),
          secure: false,
        },
        '/email-api': {
          // In production, the email server will run alongside the frontend
          target: mode === 'production' 
            ? 'http://localhost:3001' 
            : 'http://localhost:3001',  
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/email-api/, '/api/email'),
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Make WhatsApp API URL available to the app
      'import.meta.env.VITE_WHATSAPP_API_URL': JSON.stringify(whatsAppApiUrl),
    }
  };
});
