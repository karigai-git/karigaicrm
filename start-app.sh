#!/bin/bash
set -e

# Start the servers
echo "Starting Konipai CRM..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "Error: dist directory not found. Make sure to build the app first with 'npm run build'."
  exit 1
fi

# Check if dist-server directory exists
if [ ! -d "dist-server" ]; then
  echo "Error: dist-server directory not found. Make sure to build the server first with 'npm run build:server'."
  exit 1
fi

# Kill any existing serve processes
pkill -f "serve -s dist" || true
# Kill any existing server processes
pkill -f "node dist-server/server.js" || true

# Start the frontend server
echo "Starting frontend server..."
npx serve -s dist -p 8080 &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"

# Start the backend server
echo "Starting backend server..."
node dist-server/server.js &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"

echo "Konipai CRM is now running!"
echo "- Frontend: http://localhost:8080"
echo "- Backend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the servers"

# Wait for both processes to exit
wait $FRONTEND_PID $BACKEND_PID 