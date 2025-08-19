import { defineConfig, loadEnv, UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import type { IncomingMessage, ServerResponse, ClientRequest } from 'http';

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

  // Base config
  const config: UserConfig = {
    server: {
      host: "::",
      port: 8080,
      proxy: {}
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Karigai CRM',
          short_name: 'KarigaiCRM',
          description: 'CRM for Karigai',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      })
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
      'import.meta.env.VITE_VAPID_PUBLIC_KEY': JSON.stringify(env.VITE_VAPID_PUBLIC_KEY),
    }
  };

  // Add proxies only for development mode
  if (useProxies && config.server?.proxy) {
    config.server.proxy = {
      '/whatsapp-api': {
        target: whatsAppApiUrl,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/whatsapp-api/, ''),
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse) => {
            if (res.setHeader) {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            }
          });
          proxy.on('error', (err: Error) => {
            console.log('WhatsApp proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq: ClientRequest, req: IncomingMessage) => {
            console.log('Sending WhatsApp Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes: IncomingMessage, req: IncomingMessage) => {
            console.log('Received WhatsApp Response:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/email-api': {
        target: emailApiUrl,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/email-api/, ''),
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err: Error) => {
            console.log('Email proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq: ClientRequest, req: IncomingMessage) => {
            console.log('Sending Email Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes: IncomingMessage, req: IncomingMessage) => {
            console.log('Received Email Response:', proxyRes.statusCode, req.url);
          });
        }
      },
    };
  }

  return config;
});
