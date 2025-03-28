# Enabling CORS in Easypanel Services

This document explains how to enable CORS (Cross-Origin Resource Sharing) in your WhatsApp and Email API services running in Easypanel.

## WhatsApp API Service

Since we're using direct API access instead of proxy methods, you'll need to enable CORS headers in your WhatsApp API service.

### Option 1: Add CORS middleware (recommended)

1. Copy the `whatsapp-cors.js` file to your WhatsApp API server project.
2. Add the CORS middleware to your Express.js application:

```javascript
const express = require('express');
const corsMiddleware = require('./whatsapp-cors');
const app = express();

// Apply CORS middleware globally
app.use(corsMiddleware);

// Rest of your Express.js setup...
```

### Option 2: Use the CORS package

If your WhatsApp API is built with Express.js, you can use the `cors` npm package:

1. Install the package:
```bash
npm install cors
```

2. Apply it to your application:
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Apply CORS middleware globally
app.use(cors());

// Rest of your Express.js setup...
```

## Email API Service

The Email API service already has CORS headers enabled via middleware added to the Express router.

## Easypanel Configuration

In Easypanel, make sure your services are exposed with the correct domains:

1. WhatsApp API service: `backend-whatsappapi.7za6uc.easypanel.host`
2. Email API service: `backend-email.7za6uc.easypanel.host`

These domains are configured in the frontend code to be used for direct API access.

## Verifying CORS is Working

You can verify CORS is working by:

1. Opening your application in the browser
2. Opening the browser's developer tools (F12)
3. Checking the Console for any CORS-related errors
4. Watching the Network tab to see if API requests to the WhatsApp and Email services are completing successfully

If you still see CORS errors, make sure:

1. The correct domains are being used
2. CORS middleware is applied before any routes in your API servers
3. The CORS headers include the necessary origin, methods, and headers

## Troubleshooting

If you continue to experience CORS issues:

1. Check the browser console for specific error messages
2. Verify the exact request URL being used
3. Confirm that the CORS middleware is being applied correctly
4. Try temporarily setting specific origins instead of `*` if needed:

```javascript
res.header('Access-Control-Allow-Origin', 'https://crm-one.7za6uc.easypanel.host');
``` 