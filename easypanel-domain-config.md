# EasyPanel Domain Configuration

To properly configure the domains in EasyPanel for this application, follow these instructions:

## Domain Configurations Needed

Create the following domain routes in EasyPanel:

### 1. Main Web Route
- HTTPS: Enabled
- Host: crm-one.7za6uc.easypanel.host
- Path: /
- Internal Port: 80

### 2. API Route
- HTTPS: Enabled
- Host: crm-one.7za6uc.easypanel.host
- Path: /api
- Internal Port: 3000

### 3. Email API Route
- HTTPS: Enabled
- Host: crm-one.7za6uc.easypanel.host
- Path: /email-api
- Internal Port: 3000

### 4. WhatsApp API Route
- HTTPS: Enabled
- Host: crm-one.7za6uc.easypanel.host
- Path: /whatsapp-api
- Internal Port: 3000

## Environment Variables

Set these environment variables in EasyPanel:

```
NODE_ENV=production
VITE_API_URL=https://crm-one.7za6uc.easypanel.host/api
VITE_EMAIL_API_URL=https://crm-one.7za6uc.easypanel.host/email-api
VITE_WHATSAPP_API_URL=https://crm-one.7za6uc.easypanel.host/whatsapp-api
VITE_POCKETBASE_URL=https://backend-pocketbase.7za6uc.easypanel.host
POCKETBASE_ADMIN_EMAIL=your-admin-email@example.com
POCKETBASE_ADMIN_PASSWORD=your-admin-password
```

## Deployment

Use the Dockerfile in this repository for deployment, which will build both frontend and backend components. 