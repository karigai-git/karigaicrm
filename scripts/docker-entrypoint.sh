#!/bin/sh
set -e

# Debugging information
echo "Checking file system..."
ls -la
echo "Checking dist-server directory..."
ls -la dist-server || echo "dist-server not found"
echo "Checking server directory..."
ls -la dist-server/server || echo "server directory not found"

# Try multiple paths to find the server file
if [ -f "dist-server/server/server.js" ]; then
  echo "Found server.js, starting server..."
  exec node dist-server/server/server.js
elif [ -f "dist-server/server/index.js" ]; then
  echo "Found index.js, starting server..."
  exec node dist-server/server/index.js
elif [ -f "dist-server/server/fallback.js" ]; then
  echo "Using fallback server..."
  exec node dist-server/server/fallback.js
else
  echo "No server file found. Creating emergency server..."
  
  # Create a minimal Express server
  mkdir -p dist-server/server
  cat > dist-server/server/emergency.js << 'EOF'
/**
 * Emergency server script
 */
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Emergency server is running!',
    environment: process.env.NODE_ENV,
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`Emergency server running on port ${PORT}`);
});
EOF

  echo "Starting emergency server..."
  exec node dist-server/server/emergency.js
fi 