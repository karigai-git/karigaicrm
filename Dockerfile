# Use Node.js LTS as the base image
FROM node:18-alpine

# Create app directory
WORKDIR /code

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Build both frontend and server
RUN npm run build
RUN npm run build:server

# Expose ports
EXPOSE 80
EXPOSE 3000

# Create a startup script
COPY deploy.sh /deploy.sh
RUN chmod +x /deploy.sh

# Start the server
CMD ["/deploy.sh"]
