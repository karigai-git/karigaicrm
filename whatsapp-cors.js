/**
 * CORS Middleware for WhatsApp API server
 * Add this to your WhatsApp API server code to enable cross-origin requests.
 */

// CORS middleware function
function corsMiddleware(req, res, next) {
  // Allow requests from any origin
  res.header('Access-Control-Allow-Origin', '*');
  
  // Allow specific HTTP methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  
  // Allow specific headers
  res.header('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Continue to the next middleware
  next();
}

module.exports = corsMiddleware;

/**
 * Usage:
 * 
 * For Express.js:
 * 
 * const express = require('express');
 * const corsMiddleware = require('./whatsapp-cors');
 * const app = express();
 * 
 * // Apply CORS middleware globally
 * app.use(corsMiddleware);
 * 
 * // Rest of your Express.js setup...
 */ 