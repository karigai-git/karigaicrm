#!/bin/bash
set -e

# Configuration
APP_DIR="/opt/konipai-crm"
CONTAINER_NAME="konipai-crm"
DOMAIN="65.109.167.179"  # Using IP directly instead of domain name

echo "Starting Konipai CRM deployment on Hetzner..."

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    apt-get update
    apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    apt-get update
    apt-get install -y docker-ce
    systemctl enable docker
    systemctl start docker
fi

# Create app directory if it doesn't exist
mkdir -p $APP_DIR/ssl

# Create self-signed SSL certificates
echo "Creating self-signed SSL certificates..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout $APP_DIR/ssl/privkey.pem \
  -out $APP_DIR/ssl/fullchain.pem \
  -subj "/CN=$DOMAIN" \
  -addext "subjectAltName = IP:$DOMAIN"

chmod -R 755 $APP_DIR/ssl

# Create Nginx configuration
echo "Creating Nginx configuration..."
cat > $APP_DIR/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Log format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    sendfile on;
    keepalive_timeout 65;
    
    # Gzip settings
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Server block for frontend
    server {
        listen 80;
        listen [::]:80;
        server_name 65.109.167.179;  # Replace with your domain
        
        # Redirect HTTP to HTTPS
        return 301 https://$host$request_uri;
    }
    
    server {
        listen 443 ssl;
        listen [::]:443 ssl;
        server_name 65.109.167.179;  # Replace with your domain
        
        # SSL configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:10m;
        ssl_session_tickets off;
        
        # Root directory for frontend files
        root /app/dist;
        index index.html;
        
        # Handle frontend routes
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # API proxy for email server
        location /email-api/ {
            proxy_pass http://localhost:3000/api/email/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Cache static assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
            expires 7d;
            add_header Cache-Control "public, max-age=604800, immutable";
        }
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'; frame-ancestors 'self';" always;
    }
}
EOF

# Create Dockerfile
echo "Creating Dockerfile..."
cat > $APP_DIR/Dockerfile << 'EOF'
# Build stage
FROM node:20-alpine AS builder

# Set build arguments for environment variables
ARG VITE_POCKETBASE_URL
ARG POCKETBASE_ADMIN_EMAIL
ARG POCKETBASE_ADMIN_PASSWORD
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_CONTACT_EMAIL
ARG VITE_CONTACT_PHONE
ARG VITE_AWS_REGION
ARG VITE_AWS_IDENTITY_POOL_ID

# Set environment variables for build
ENV VITE_POCKETBASE_URL=${VITE_POCKETBASE_URL}
ENV VITE_RAZORPAY_KEY_ID=${VITE_RAZORPAY_KEY_ID}
ENV VITE_CONTACT_EMAIL=${VITE_CONTACT_EMAIL}
ENV VITE_CONTACT_PHONE=${VITE_CONTACT_PHONE}
ENV VITE_AWS_REGION=${VITE_AWS_REGION}
ENV VITE_AWS_IDENTITY_POOL_ID=${VITE_AWS_IDENTITY_POOL_ID}
ENV POCKETBASE_ADMIN_EMAIL=${POCKETBASE_ADMIN_EMAIL}
ENV POCKETBASE_ADMIN_PASSWORD=${POCKETBASE_ADMIN_PASSWORD}

# Install global dependencies
RUN npm install -g tsx serve

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build React app
RUN npm run build

# Build server
RUN npm run build:server

# Final stage
FROM nginx:alpine

# Install Node.js in final image
RUN apk add --update nodejs npm \
    && npm install -g tsx serve

# Create directories
RUN mkdir -p /app/dist /app/dist-server /etc/nginx/ssl

# Copy Nginx configuration
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf

# Copy build files from builder stage
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/dist-server /app/dist-server
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules

# Create start script
RUN echo '#!/bin/sh\n\
cd /app && node dist-server/server.js &\n\
nginx -g "daemon off;"' > /start.sh && \
chmod +x /start.sh

# Expose ports
EXPOSE 80 443 3001

# Start command
CMD ["/start.sh"]
EOF

# Stop existing container if running
if docker ps -a | grep -q $CONTAINER_NAME; then
  echo "Stopping existing container..."
  docker stop $CONTAINER_NAME || true
  docker rm $CONTAINER_NAME || true
fi

# Build Docker image
echo "Building Docker image..."
cd $APP_DIR
docker build -t konipai-crm-hetzner -f Dockerfile .

# Run the container
echo "Starting container..."
docker run -d --name $CONTAINER_NAME \
  -p 80:80 \
  -p 443:443 \
  -p 3001:3001 \
  -v $APP_DIR/ssl:/etc/nginx/ssl \
  --restart unless-stopped \
  konipai-crm-hetzner

echo "Deployment completed successfully!"
echo "Your application is now accessible at https://$DOMAIN" 