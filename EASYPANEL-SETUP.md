# Konipai CRM - EasyPanel Deployment Guide

This guide outlines how to deploy the Konipai CRM as separate frontend and backend services in EasyPanel.

## Architecture

The application is now split into two separate services:

1. **Frontend**: A static React application served by an nginx web server
2. **Backend**: A Node.js Express server that provides the email API

## Prerequisites

- EasyPanel installed and running
- Git repository access (GitHub or other)
- Docker and Docker Compose installed on your local machine for testing

## Local Development

To test the split services locally:

```bash
# Clone the repository
git clone https://github.com/rizo8107/konipai-crm-trove.git
cd konipai-crm-trove

# Check out the split-services branch
git checkout split-services

# Run with Docker Compose
docker-compose -f docker-compose.split.yml up
```

The frontend will be available at http://localhost:5000 and the backend at http://localhost:3000.

## EasyPanel Deployment

### 1. Deploy Backend Server

1. In EasyPanel, create a new service:
   - Name: `konipai-api`
   - Repository: `https://github.com/rizo8107/konipai-crm-trove.git`
   - Branch: `split-services`
   - Dockerfile: `Dockerfile.backend`
   
2. Configure environment variables:
   - Add all variables from `.env.backend.production`
   
3. Configure ports:
   - Container port: `3000`
   - Public port: Select any available port or use a proxy

4. Set up health check:
   - Path: `/health`
   - Port: `3000`

5. Deploy the service

### 2. Deploy Frontend Application

1. In EasyPanel, create a new service:
   - Name: `konipai-frontend`
   - Repository: `https://github.com/rizo8107/konipai-crm-trove.git`
   - Branch: `split-services`
   - Dockerfile: `Dockerfile.frontend`
   
2. Configure environment variables:
   - Add all variables from `.env.frontend.production`
   - **IMPORTANT**: Set `VITE_API_URL` and `VITE_EMAIL_API_URL` to point to your backend service
   
3. Configure ports:
   - Container port: `5000`
   - Public port: Select any available port or use a proxy

4. Deploy the service

### 3. Configure Custom Domains (Optional)

1. For the frontend:
   - Domain: your-domain.com
   
2. For the backend:
   - Domain: api.your-domain.com

## Troubleshooting

### API Connection Issues

If the frontend cannot connect to the backend:

1. Ensure the backend is running and healthy
2. Check that the environment variables are set correctly:
   - `VITE_API_URL` should point to the backend API URL
   - `VITE_EMAIL_API_URL` should point to the backend email API URL
3. Verify network connectivity between services
4. Check that CORS is configured correctly on the backend

### Email Service Issues

If emails are not sending:

1. Check the email configuration in the backend environment variables
2. Verify that the SMTP server is accessible from the backend
3. Check the backend logs for any error messages

### PocketBase Connection Issues

If there are issues connecting to PocketBase:

1. Ensure the PocketBase URL is correct
2. Verify that the admin credentials are correct
3. Check network connectivity to the PocketBase service 