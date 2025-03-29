#!/bin/sh
# Custom build script that addresses both TypeScript import.meta.env issues and missing modules

# Set memory limit for Node to prevent OOM issues
export NODE_OPTIONS="--max-old-space-size=512"

# Use production mode to reduce memory usage
export NODE_ENV=production

echo "==== Starting Konipai CRM build process ===="

# Install all dependencies to ensure we have everything needed for the build
echo "Installing dependencies..."
npm install --no-fund --no-audit

# Install the missing nodemailer-mailgun-transport dependency
echo "Installing missing dependencies..."
npm install nodemailer-mailgun-transport --no-fund --no-audit --no-save

# Create a custom TypeScript declaration file for import.meta.env
echo "Creating TypeScript declaration for import.meta.env..."
mkdir -p src/types
cat > src/types/import-meta.d.ts << 'EOF'
interface ImportMeta {
  env: {
    [key: string]: any;
    VITE_POCKETBASE_URL?: string;
    VITE_WHATSAPP_API_URL?: string;
    VITE_GEMINI_API_KEY?: string;
    VITE_EMAIL_API_URL?: string;
    VITE_RAZORPAY_KEY_ID?: string;
    VITE_SITE_TITLE?: string;
    VITE_SITE_LOGO?: string;
    MODE?: string;
    DEV?: boolean;
    PROD?: boolean;
  };
}
EOF

# Update nodemailer-mailgun-transport typings
echo "Creating TypeScript declaration for nodemailer-mailgun-transport..."
mkdir -p src/types/nodemailer-mailgun-transport
cat > src/types/nodemailer-mailgun-transport/index.d.ts << 'EOF'
declare module 'nodemailer-mailgun-transport' {
  import { Transport, TransportOptions } from 'nodemailer';
  
  interface MailgunTransportOptions {
    auth: {
      api_key: string;
      domain: string;
    };
    host?: string;
    protocol?: string;
    port?: number;
    proxy?: string;
  }
  
  function mailgunTransport(options: MailgunTransportOptions): Transport | TransportOptions;
  
  export = mailgunTransport;
}
EOF

# Build the frontend with limited concurrency
echo "Building frontend..."
NODE_ENV=production npx vite build --minify --outDir dist

# Manual server build with proper TypeScript configuration
echo "Building server manually..."
mkdir -p dist-server

# Temporarily modify tsconfig.server.json to include custom type declarations
cp tsconfig.server.json tsconfig.server.backup.json
node -e "
  const fs = require('fs');
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.server.json', 'utf8'));
  
  // Update the TypeScript configuration to use our custom types
  tsconfig.compilerOptions = {
    ...tsconfig.compilerOptions,
    skipLibCheck: true,
    typeRoots: ['./node_modules/@types', './src/types']
  };
  
  // Write the updated config
  fs.writeFileSync('tsconfig.server.json', JSON.stringify(tsconfig, null, 2));
"

# Run TypeScript compiler with the updated configuration
echo "Compiling server TypeScript files..."
npx tsc -p tsconfig.server.json

# Restore original tsconfig
mv tsconfig.server.backup.json tsconfig.server.json

# Copy necessary directories
echo "Copying server files..."
mkdir -p dist-server/server dist-server/api dist-server/lib
cp -r src/server dist-server/
cp -r src/api dist-server/
cp -r src/lib dist-server/

# Clean up to reduce image size
echo "Cleaning up..."
npm prune --production
rm -rf node_modules/.cache
rm -rf src/types/import-meta.d.ts
rm -rf src/types/nodemailer-mailgun-transport

echo "==== Build completed successfully =====" 