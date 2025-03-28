import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from 'fs';

// Try to read the port-info.json file to get the actual server port
function getEmailServerPort() {
  try {
    if (fs.existsSync('port-info.json')) {
      const portInfo = JSON.parse(fs.readFileSync('port-info.json', 'utf8'));
      return portInfo.port;
    }
  } catch (err) {
    console.warn('Could not read port-info.json, falling back to default port', err);
  }
  return 3001; // Default fallback port
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Determine the email server port
  const emailServerPort = getEmailServerPort();
  console.log(`Configuring email API proxy with port: ${emailServerPort}`);
  
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/whatsapp-api': {
          target: 'https://backend-whatsappapi.7za6uc.easypanel.host',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/whatsapp-api/, ''),
          secure: false,
        },
        '/email-api': {
          target: `http://localhost:${emailServerPort}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/email-api/, '/api/email'),
          secure: false,
        },
        // Add direct access to port-info.json
        '/port-info.json': {
          target: `http://localhost:${emailServerPort}`,
          changeOrigin: true,
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
  };
});
