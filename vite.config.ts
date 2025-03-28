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
  
  // Email service configuration - default to local server in development
  const emailApiUrl = mode === 'production'
    ? (env.EMAIL_API_URL || 'http://localhost:3001')
    : 'http://localhost:3001';
  
  console.log(`Configuring WhatsApp API proxy with target: ${whatsAppApiUrl}`);
  console.log(`Configuring Email API proxy with target: ${emailApiUrl}`);
  
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
          configure: (proxy, _options) => {
            // Add CORS headers to all responses
            proxy.on('proxyRes', (proxyRes, _req, _res) => {
              // Add CORS headers
              proxyRes.headers['Access-Control-Allow-Origin'] = '*';
              proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
              proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
            });
            
            proxy.on('error', (err, _req, _res) => {
              console.log('WhatsApp proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending WhatsApp Request:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received WhatsApp Response:', proxyRes.statusCode, req.url);
            });
          }
        },
        '/email-api': {
          target: emailApiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/email-api/, '/api/email'),
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Email proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Email Request:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Email Response:', proxyRes.statusCode, req.url);
            });
          }
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
      // ALWAYS use proxy path for client-side requests to avoid CORS issues
      'import.meta.env.VITE_WHATSAPP_API_URL': JSON.stringify('/whatsapp-api'),
      // Define email API URL for client-side use
      'import.meta.env.VITE_EMAIL_API_URL': JSON.stringify('/email-api'),
    }
  };
});
