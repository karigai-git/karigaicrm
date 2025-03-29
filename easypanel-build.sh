#!/bin/sh
# Easypanel build script for Konipai CRM

# Ensure we have all dependencies including dev dependencies
npm install

# Build the frontend
npm run build

# Build the server
npm run build:server

# Optionally prune dev dependencies for production
npm prune --production 