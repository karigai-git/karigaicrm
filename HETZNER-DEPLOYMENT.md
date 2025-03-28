# Konipai CRM Deployment Guide for Hetzner

This guide walks you through deploying the Konipai CRM application on a Hetzner server using Docker and Nginx.

## Prerequisites

- A Hetzner Cloud server (recommended: CX21 or higher with Ubuntu 22.04)
- A domain name pointing to your Hetzner server
- Docker installed on both your local machine and the Hetzner server

## Step 1: Prepare Your Hetzner Server

1. Create a new server on Hetzner Cloud with Ubuntu 22.04
2. Install Docker:

```bash
ssh root@YOUR_SERVER_IP

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

## Step 2: Configure Your Domain

Make sure your domain (e.g., konipai.example.com) points to your Hetzner server's IP address by setting an A record in your DNS settings.

## Step 3: Configure the Deployment Files

1. Update the `nginx.conf` file:
   - Replace `konipai.example.com` with your actual domain name

2. Update the `deploy-hetzner.sh` script:
   - Set `SERVER_IP` to your Hetzner server's IP address
   - Set `DOMAIN` to your actual domain name
   - Set `USERNAME` to your SSH username (usually "root" for Hetzner)

3. Make the script executable:
   ```bash
   chmod +x deploy-hetzner.sh
   ```

## Step 4: Deploy the Application

1. Run the deployment script:
   ```bash
   ./deploy-hetzner.sh
   ```

   This script will:
   - Build a Docker image locally
   - Upload it to your Hetzner server
   - Set up SSL certificates with Let's Encrypt
   - Deploy and start the application

2. The deployment process will take a few minutes. Once completed, your application will be accessible at `https://your-domain.com`.

## Step 5: Verify the Deployment

1. Visit your domain in a browser to verify that the application is accessible
2. Check that HTTPS is working correctly
3. Verify that the email API is functioning by testing email features

## Troubleshooting

### SSL Certificate Issues

If you encounter SSL certificate issues:

```bash
ssh root@YOUR_SERVER_IP

# Check Certbot logs
cat /var/log/letsencrypt/letsencrypt.log

# Verify certificates exist
ls -la /etc/letsencrypt/live/your-domain.com/
```

### Container Not Starting

Check Docker logs:

```bash
ssh root@YOUR_SERVER_IP

# Check container status
docker ps -a

# View container logs
docker logs konipai-crm
```

### Nginx Configuration Issues

Check Nginx logs:

```bash
ssh root@YOUR_SERVER_IP

# Enter the container
docker exec -it konipai-crm sh

# Check Nginx configuration
nginx -t

# View Nginx logs
cat /var/log/nginx/error.log
```

## Maintenance

### Updating the Application

To update the application, simply run the deployment script again:

```bash
./deploy-hetzner.sh
```

### Backup

Regularly back up your data:

```bash
ssh root@YOUR_SERVER_IP

# Backup SSL certificates
mkdir -p /backup/ssl
cp -r /etc/letsencrypt/live/your-domain.com/ /backup/ssl/
```

### Monitoring

Consider setting up monitoring for your server using tools like:
- Netdata
- Prometheus + Grafana
- UptimeRobot for external monitoring

## Security Considerations

1. Consider setting up a non-root user with sudo privileges
2. Configure a firewall (UFW) to restrict access
3. Set up automatic security updates
4. Implement fail2ban to prevent brute force attacks

## Support

If you encounter any issues with the deployment, please check the container logs and Nginx error logs for more information.

For further assistance, contact the support team at support@konipai.in. 