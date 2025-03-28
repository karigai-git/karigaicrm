#!/bin/bash
set -e

# Configuration
SERVER_IP="YOUR_HETZNER_SERVER_IP"
USERNAME="root" # or your sudo user
APP_DIR="/opt/konipai-crm"
DOMAIN="konipai.example.com" # Replace with your domain

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment to Hetzner...${NC}"

# Build the Docker image locally
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t konipai-crm-hetzner -f Dockerfile.hetzner .

# Save the Docker image as a tar file
echo -e "${YELLOW}Saving Docker image...${NC}"
docker save konipai-crm-hetzner | gzip > konipai-crm-hetzner.tar.gz

# Upload the image to the server
echo -e "${YELLOW}Uploading Docker image to server...${NC}"
scp konipai-crm-hetzner.tar.gz $USERNAME@$SERVER_IP:/tmp/

# Create a deployment script to run on the server
cat > deploy-remote.sh << 'EOL'
#!/bin/bash
set -e

# Configuration
APP_DIR="/opt/konipai-crm"
CONTAINER_NAME="konipai-crm"

# Create app directory if it doesn't exist
mkdir -p $APP_DIR
cd $APP_DIR

# Load the Docker image
echo "Loading Docker image..."
docker load < /tmp/konipai-crm-hetzner.tar.gz

# Stop the existing container if it exists
if docker ps -a | grep -q $CONTAINER_NAME; then
  echo "Stopping existing container..."
  docker stop $CONTAINER_NAME || true
  docker rm $CONTAINER_NAME || true
fi

# Set up SSL certificates with Let's Encrypt (if they don't exist)
if [ ! -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
  echo "Setting up SSL certificates with Let's Encrypt..."
  apt-get update
  apt-get install -y certbot
  certbot certonly --standalone --non-interactive --agree-tos --email admin@yourdomain.com -d $DOMAIN
fi

# Create directory for SSL certificates
mkdir -p $APP_DIR/ssl

# Copy SSL certificates
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $APP_DIR/ssl/
chmod -R 755 $APP_DIR/ssl

# Run the new container
echo "Starting new container..."
docker run -d --name $CONTAINER_NAME \
  -p 80:80 \
  -p 443:443 \
  -p 3001:3001 \
  -v $APP_DIR/ssl:/etc/nginx/ssl \
  --restart unless-stopped \
  konipai-crm-hetzner

echo "Deployment completed successfully!"

# Clean up
rm /tmp/konipai-crm-hetzner.tar.gz
EOL

# Upload the deployment script to the server
echo -e "${YELLOW}Uploading deployment script...${NC}"
scp deploy-remote.sh $USERNAME@$SERVER_IP:/tmp/
rm deploy-remote.sh

# Execute the deployment script on the server
echo -e "${YELLOW}Executing deployment script on server...${NC}"
ssh $USERNAME@$SERVER_IP "chmod +x /tmp/deploy-remote.sh && /tmp/deploy-remote.sh"

# Clean up local files
echo -e "${YELLOW}Cleaning up...${NC}"
rm konipai-crm-hetzner.tar.gz

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Your application is now accessible at https://$DOMAIN${NC}" 