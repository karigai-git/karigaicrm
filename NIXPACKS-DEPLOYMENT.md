# Deploying Konipai CRM with Nixpacks

This document provides detailed instructions on how to build, deploy, and manage your Konipai CRM application using Nixpacks.

## What is Nixpacks?

Nixpacks is a build system that automatically detects the language and framework of your application and creates optimized containers. It's similar to buildpacks but leverages the Nix package manager for more precise dependency management.

## Prerequisites

- Git
- Node.js and npm (for local development)
- Docker (optional, for containerized deployments)
- Nixpacks CLI (will be installed automatically by the build script)

## Environment Variables

Your application requires the following environment variables:

| Variable | Description | Example Value |
|----------|-------------|--------------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Main application port | `8080` |
| `SERVER_PORT` | API server port | `4000` |
| `VITE_EMAIL_API_URL` | Email API endpoint | `/email-api` |
| `VITE_WHATSAPP_API_URL` | WhatsApp API endpoint | `/email-api/proxy-whatsapp` |
| `VITE_POCKETBASE_URL` | PocketBase API URL | `https://backend-pocketbase.example.com` |
| `WHATSAPP_API_URL` | Backend WhatsApp API URL | `https://backend-whatsappapi.example.com` |
| `SMTP_HOST` | SMTP server host | `smtp.example.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `user@example.com` |
| `SMTP_PASS` | SMTP password | `your-password` |

## Local Deployment

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd konipai-crm-trove
   ```

2. Make the build script executable:
   ```bash
   chmod +x build-with-nixpacks.sh
   ```

3. Run the build script:
   ```bash
   ./build-with-nixpacks.sh
   ```

4. Navigate to the build directory and start the application:
   ```bash
   cd nixpacks-build
   ./start
   ```

5. The application should now be running at:
   - Main application: http://localhost:8080
   - API server: http://localhost:4000

## Deploying to Cloud Platforms

### Render

Render natively supports Nixpacks for deployment:

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Sign up or log in to [Render](https://render.com/)
3. Create a new Web Service and connect your repository
4. Configure your service:
   - **Environment**: `Node`
   - **Build Command**: `nixpacks build .`
   - **Start Command**: `./start`
5. Add all required environment variables in the Render dashboard
6. Click "Create Web Service"

### Railway

Railway also supports Nixpacks:

1. Push your code to a GitHub repository
2. Sign up or log in to [Railway](https://railway.app/)
3. Create a new project and select your repository
4. Configure the deployment:
   - **Builder**: `Nixpacks`
   - Add environment variables in the Railway dashboard
5. Deploy the service

### Docker Deployment

You can also generate a Dockerfile and deploy using Docker:

1. Generate a Dockerfile:
   ```bash
   nixpacks build . --name konipai-crm --env-file .env --docker-file > Dockerfile
   ```

2. Build the Docker image:
   ```bash
   docker build -t konipai-crm:latest .
   ```

3. Run the container:
   ```bash
   docker run -p 8080:8080 -p 4000:4000 --env-file .env konipai-crm:latest
   ```

## Troubleshooting

### Build Failures

1. **Dependencies not found**: Make sure package.json includes all required dependencies.
   ```bash
   # Check for missing dependencies
   npm ls
   ```

2. **Memory issues during build**: You may need to increase memory allocation.
   ```bash
   # Set higher memory limits
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

3. **Permissions issues**: Ensure the build script is executable.
   ```bash
   chmod +x build-with-nixpacks.sh
   ```

### Runtime Errors

1. **CORS errors**: Ensure your API proxy endpoints are correctly configured.
   - Check that `VITE_EMAIL_API_URL` and `VITE_WHATSAPP_API_URL` point to the correct locations.
   - Verify that CORS headers are properly set in the server responses.

2. **Email/WhatsApp API connectivity issues**:
   - Verify API URLs are correct and the services are running.
   - Check network connectivity between your app and these services.
   - Inspect server logs for detailed error messages.

3. **Port conflicts**: If ports are already in use, modify the PORT/SERVER_PORT variables.

## Monitoring and Logs

When deployed, you can view logs:

- In Render: Dashboard > Your Service > Logs
- In Railway: Dashboard > Your Project > Deployments > Logs
- With Docker: `docker logs <container-id>`

## Additional Resources

- [Nixpacks Documentation](https://nixpacks.com/docs)
- [Render Nixpacks Guide](https://render.com/docs/nixpacks)
- [Railway Deployment Guide](https://docs.railway.app/deploy/nixpacks)

## Maintenance

- Regularly update your dependencies using `npm update`
- Monitor for security vulnerabilities with `npm audit`
- Keep Nixpacks updated by running `curl -sSL https://nixpacks.com/install.sh | bash` 