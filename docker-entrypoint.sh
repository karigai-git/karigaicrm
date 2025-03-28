#!/bin/sh
set -e

echo "Starting Konipai CRM..."
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Start the frontend server
echo "Starting frontend server on port 8080..."
npx serve -s dist -p 8080 &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"

# Give the frontend server a moment to start
sleep 2

# Start the backend server
echo "Starting backend server..."
cd /app && tsx src/server/index.ts

# This won't be reached unless the backend server exits
wait $FRONTEND_PID 