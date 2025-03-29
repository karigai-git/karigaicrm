# Use Node.js LTS as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build both the frontend and server
RUN npm run build:all

# Expose the ports the app runs on
EXPOSE 4000 8080

# Start the server
CMD ["npm", "run", "start:server"]
