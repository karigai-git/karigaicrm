#!/bin/sh
# Easypanel build script for Konipai CRM

# Set memory limit for Node to prevent OOM issues
export NODE_OPTIONS="--max-old-space-size=512"

# Use production mode to reduce memory usage
export NODE_ENV=production

# Install only production dependencies first
echo "Installing production dependencies..."
npm install --production --no-fund --no-audit

# Then install dev dependencies separately
echo "Installing development dependencies..."
npm install --no-fund --no-audit --no-save

# Build the frontend with limited concurrency
echo "Building frontend..."
NODE_ENV=production npx vite build --minify --outDir dist

# Build the server
echo "Building server..."
npm run build:server

# Clean up to reduce image size
echo "Cleaning up..."
npm prune --production
rm -rf node_modules/.cache 