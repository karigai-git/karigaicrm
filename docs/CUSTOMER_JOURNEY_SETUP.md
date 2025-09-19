# Customer Journey Tracking System

## Overview

This system provides comprehensive customer journey tracking with real-time webhook functionality. It visualizes customer progression through different stages and captures events via webhooks.

## Features

- **Interactive Journey Visualization**: Visual representation of customer journey stages
- **Real-time Event Tracking**: Live updates via webhook endpoints
- **Customer Analytics**: Detailed metrics and conversion rates
- **Webhook Testing**: Built-in tools for testing webhook integration
- **Secure Processing**: Signature verification and input validation

## Installation

### Prerequisites

- Node.js 18+ 
- PocketBase (optional, for persistent storage)
- Environment variables configured

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file with:
   ```env
   WEBHOOK_SECRET=your-webhook-secret-key
   VITE_POCKETBASE_URL=your-pocketbase-url (optional)
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

4. **Access the Journey Page**
   Navigate to `/admin/customer-journey` in your application

## API Endpoints

### Webhook Endpoint
```
POST /api/webhook/customer-journey
```

**Headers:**
- `Content-Type: application/json`
- `X-Webhook-Signature: sha256=<signature>` (optional)

**Payload:**
```json
{
  "customer_id": "12345",
  "event": "stage_completed",
  "stage": "consideration",
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": {
    "source": "email_campaign",
    "value": 150.00
  },
  "customer_name": "John Doe",
  "customer_email": "john@example.com"
}
```

### Data Retrieval
```
GET /api/customer-journey/data
```

Returns current customer journey data including customers and events.

### Customer Details
```
GET /api/customer-journey/customer/:id
```

Returns detailed information for a specific customer.

### Health Check
```
GET /api/customer-journey/health
```

Returns system health status and basic metrics.

## Journey Stages

1. **Awareness** - Customer discovers your brand
2. **Consideration** - Customer evaluates your products
3. **Purchase** - Customer makes a purchase
4. **Retention** - Customer returns for more purchases
5. **Advocacy** - Customer becomes a brand advocate

## Event Types

- `stage_entered` - Customer enters a new stage
- `stage_completed` - Customer completes a stage
- `purchase_made` - Customer makes a purchase
- `email_opened` - Customer opens an email
- `link_clicked` - Customer clicks a link
- `form_submitted` - Customer submits a form
- `page_viewed` - Customer views a page
- `cart_abandoned` - Customer abandons their cart
- `review_left` - Customer leaves a review
- `referral_made` - Customer refers someone

## Security

### Webhook Signature Verification

Webhooks can be secured using HMAC SHA-256 signatures:

1. Set `WEBHOOK_SECRET` environment variable
2. Generate signature: `sha256=<hmac_sha256(payload, secret)>`
3. Include in `X-Webhook-Signature` header

### Input Validation

All webhook payloads are validated for:
- Required fields presence
- Data type correctness
- Valid enum values
- Email format validation
- Timestamp format validation

## Data Storage

The system supports two storage modes:

1. **In-Memory Storage** (default)
   - Fast and simple
   - Data lost on restart
   - Good for development/testing

2. **PocketBase Storage** (optional)
   - Persistent storage
   - Automatic collection creation
   - Production-ready

## Integration Examples

### Google Analytics Integration
```javascript
// Track stage progression in GA
gtag('event', 'stage_completed', {
  'custom_parameter_stage': 'consideration',
  'custom_parameter_customer_id': '12345'
});

// Send to webhook
fetch('/api/webhook/customer-journey', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_id: '12345',
    event: 'stage_completed',
    stage: 'consideration',
    timestamp: new Date().toISOString(),
    metadata: { source: 'google_analytics' }
  })
});
```

### Email Marketing Integration
```javascript
// When customer opens email
function onEmailOpen(customerId, campaignId) {
  fetch('/api/webhook/customer-journey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: customerId,
      event: 'email_opened',
      stage: 'retention',
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'email_campaign',
        campaign_id: campaignId
      }
    })
  });
}
```

### E-commerce Integration
```javascript
// When customer makes purchase
function onPurchaseComplete(order) {
  fetch('/api/webhook/customer-journey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: order.customer_id,
      event: 'purchase_made',
      stage: 'purchase',
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'ecommerce',
        value: order.total,
        order_id: order.id
      },
      customer_name: order.customer_name,
      customer_email: order.customer_email
    })
  });
}
```

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook URL is correct
   - Verify CORS headers are set
   - Check network connectivity
   - Validate payload format

2. **Signature Verification Failing**
   - Ensure `WEBHOOK_SECRET` is set correctly
   - Check signature generation algorithm
   - Verify header format: `sha256=<signature>`

3. **Events Not Appearing**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check PocketBase connection if using persistent storage

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=customer-journey:*
```

## Performance Considerations

- Events are processed asynchronously
- In-memory storage has limits (use PocketBase for production)
- Consider rate limiting for high-volume webhooks
- Implement event deduplication for reliability

## Security Best Practices

1. Always use HTTPS in production
2. Implement webhook signature verification
3. Validate all input data
4. Use rate limiting to prevent abuse
5. Log security events for monitoring
6. Regularly rotate webhook secrets