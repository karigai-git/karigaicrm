#!/bin/bash
# Deployment script for Konipai CRM

# Navigate to project directory
cd /code

# Install dependencies
npm install

# Build the frontend
npm run build

# Build the server-side code
npm run build:server

# Copy environment variables if needed
if [ -f .env.production ]; then
  cp .env.production .env
fi

# Ensure the build directory has proper permissions
chmod -R 755 dist/
chmod -R 755 dist-server/

# Start the server
node dist-server/server/index.js 