#!/bin/bash
set -e

# Configuration
SERVER_IP="65.109.167.179"
USERNAME="root" # or your sudo user
APP_DIR="/opt/konipai-crm"
DOMAIN="65.109.167.179" # Using IP directly instead of domain name

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set up sshpass to handle password authentication
echo -e "${YELLOW}Installing sshpass...${NC}"
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}sshpass not found. Installing...${NC}"
    apt-get update && apt-get install -y sshpass || {
        echo -e "${RED}Failed to install sshpass. Please install it manually.${NC}"
        exit 1
    }
fi

# SSH password
SSH_PASSWORD="Life@123"

echo -e "${GREEN}Starting deployment to Hetzner...${NC}"

# Build the Docker image locally
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t konipai-crm-hetzner -f Dockerfile.hetzner .

# Save the Docker image as a tar file
echo -e "${YELLOW}Saving Docker image...${NC}"
docker save konipai-crm-hetzner | gzip > konipai-crm-hetzner.tar.gz

# Upload the image to the server
echo -e "${YELLOW}Uploading Docker image to server...${NC}"
sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no konipai-crm-hetzner.tar.gz $USERNAME@$SERVER_IP:/tmp/

# Create a deployment script to run on the server
cat > deploy-remote.sh << 'EOF'
#!/bin/bash
set -e

# Configuration
APP_DIR="/opt/konipai-crm"
CONTAINER_NAME="konipai-crm"
DOMAIN="65.109.167.179"  # Using IP directly instead of domain name

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

# Create directory for SSL certificates if it doesn't exist
mkdir -p $APP_DIR/ssl

# Create self-signed SSL certificates
echo "Creating self-signed SSL certificates..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout $APP_DIR/ssl/privkey.pem \
  -out $APP_DIR/ssl/fullchain.pem \
  -subj "/CN=$DOMAIN" \
  -addext "subjectAltName = IP:$DOMAIN"

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
EOF

# Upload the deployment script to the server
echo -e "${YELLOW}Uploading deployment script...${NC}"
sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no deploy-remote.sh $USERNAME@$SERVER_IP:/tmp/
rm deploy-remote.sh

# Execute the deployment script on the server
echo -e "${YELLOW}Executing deployment script on server...${NC}"
sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no $USERNAME@$SERVER_IP "chmod +x /tmp/deploy-remote.sh && /tmp/deploy-remote.sh"

# Clean up local files
echo -e "${YELLOW}Cleaning up...${NC}"
rm konipai-crm-hetzner.tar.gz

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Your application is now accessible at https://$DOMAIN${NC}" 