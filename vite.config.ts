import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get API URLs from .env or use defaults
  const whatsAppApiUrl = env.WHATSAPP_API_URL || 'https://backend-whatsappapi.7za6uc.easypanel.host';
  const emailApiUrl = env.EMAIL_API_URL || 'https://backend-email.7za6uc.easypanel.host/api/email';
  
  console.log(`WhatsApp API URL: ${whatsAppApiUrl}`);
  console.log(`Email API URL: ${emailApiUrl}`);
  
  // Determine if we need proxies for development mode
  const useProxies = mode === 'development';
  console.log(`Using proxies for API calls: ${useProxies}`);
  
  // Base config without proxies
  const config = {
    server: {
      host: "::",
      port: 8080,
      proxy: {}
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
      // Make API URLs available to the app
      'import.meta.env.VITE_WHATSAPP_API_URL': JSON.stringify(
        useProxies ? '/whatsapp-api' : whatsAppApiUrl
      ),
      'import.meta.env.VITE_EMAIL_API_URL': JSON.stringify(
        useProxies ? '/email-api' : emailApiUrl
      ),
    }
  };
  
  // Add proxies only for development mode
  if (useProxies) {
    config.server.proxy = {
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
        rewrite: (path) => path.replace(/^\/email-api/, ''),
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
    };
  }
  
  return config;
});
