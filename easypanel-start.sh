#!/bin/sh
# Easypanel start script for Zenthra CRM

# Start the backend server
node dist-server/server/index.js &
SERVER_PID=$!

# Start the frontend server
npx serve -s dist -l ${PORT:-8080} &
SERVE_PID=$!

# Handle process termination
trap "kill $SERVER_PID $SERVE_PID" SIGINT SIGTERM

# Wait for both processes
wait 