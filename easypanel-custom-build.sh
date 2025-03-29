#!/bin/sh
# Custom build script that avoids the problematic tsx --build command

# Set memory limit for Node to prevent OOM issues
export NODE_OPTIONS="--max-old-space-size=512"

# Use production mode to reduce memory usage
export NODE_ENV=production

echo "==== Starting Konipai CRM build process ===="

# Install only production dependencies first
echo "Installing production dependencies..."
npm install --production --no-fund --no-audit

# Then install dev dependencies separately
echo "Installing development dependencies..."
npm install --no-fund --no-audit --no-save

# Build the frontend with limited concurrency
echo "Building frontend..."
NODE_ENV=production npx vite build --minify --outDir dist

# Manual server build instead of using build:server script
echo "Building server manually..."
mkdir -p dist-server
npx tsc -p tsconfig.server.json

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

echo "==== Build completed successfully ====" 