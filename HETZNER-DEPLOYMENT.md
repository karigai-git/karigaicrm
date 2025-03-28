# Konipai CRM Deployment Guide for Hetzner

This guide walks you through deploying the Konipai CRM application on our Hetzner server using Docker and Nginx.

## Server Information

- **Server IP**: 65.109.167.179
- **Username**: root
- **Password**: Life@123

## Deployment Process

The deployment process has been automated using the `deploy-hetzner.sh` script. This script:

1. Builds the Docker image locally
2. Uploads it to the Hetzner server
3. Sets up SSL certificates with Let's Encrypt
4. Deploys and starts the application

## Manual Deployment Steps (if needed)

### Step 1: Connect to the Hetzner Server

```bash
ssh root@65.109.167.179
# Enter password: Life@123
```

### Step 2: Install Docker (if not already installed)

```bash
# Update package information
apt-get update

# Install required packages
apt-get install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

# Add Docker repository
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Update package database
apt-get update

# Install Docker
apt-get install -y docker-ce

# Verify Docker is installed correctly
docker run hello-world
```

### Step 3: Deploy the Application Manually

1. Copy the Docker image to the server:
   ```bash
   # On your local machine
   docker build -t konipai-crm-hetzner -f Dockerfile.hetzner .
   docker save konipai-crm-hetzner | gzip > konipai-crm-hetzner.tar.gz
   scp konipai-crm-hetzner.tar.gz root@65.109.167.179:/tmp/
   ```

2. On the server, load and run the Docker image:
   ```bash
   # Load the Docker image
   docker load < /tmp/konipai-crm-hetzner.tar.gz

   # Create application directory
   mkdir -p /opt/konipai-crm/ssl

   # Create self-signed certificates (temporary until Let's Encrypt is set up)
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /opt/konipai-crm/ssl/privkey.pem \
     -out /opt/konipai-crm/ssl/fullchain.pem \
     -subj "/CN=65.109.167.179"

   # Run the Docker container
   docker run -d --name konipai-crm \
     -p 80:80 \
     -p 443:443 \
     -p 3001:3001 \
     -v /opt/konipai-crm/ssl:/etc/nginx/ssl \
     --restart unless-stopped \
     konipai-crm-hetzner
   ```

## Accessing the Application

Once deployed, the application will be accessible at:
- https://65.109.167.179

## Troubleshooting

### Viewing Container Logs

```bash
ssh root@65.109.167.179
docker logs konipai-crm
```

### Restarting the Container

```bash
ssh root@65.109.167.179
docker restart konipai-crm
```

### Check Container Status

```bash
ssh root@65.109.167.179
docker ps -a
```

### Entering the Container

```bash
ssh root@65.109.167.179
docker exec -it konipai-crm sh
```

## Support

If you encounter any issues with the deployment, check the container logs for more information.

For further assistance, contact the support team. 