#!/bin/bash
# Build script for the Zenthra CRM Trove application using Nixpacks

set -e  # Exit immediately if a command exits with a non-zero status

# Print colored output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Starting Nixpacks build for Zenthra CRM ===${NC}"

# Check if Nixpacks is installed
if ! command -v nixpacks &> /dev/null; then
    echo -e "${YELLOW}Nixpacks is not installed. Installing nixpacks...${NC}"
    # Install Nixpacks (if not already installed)
    curl -sSL https://nixpacks.com/install.sh | bash
fi

# Create a build directory if it doesn't exist
mkdir -p ./nixpacks-build

# Set environment variables for the build
export NIXPACKS_METADATA_PORT=8080
export NIXPACKS_FORCE_FS_USR=1
export NIXPACKS_ENABLE_NODE_CA_CERTIFICATES=1

echo -e "${GREEN}Starting build process...${NC}"

# Build the application using Nixpacks
# This reads the nixpacks.toml configuration and builds the app
nixpacks build . \
  --name konipai-crm \
  --env-file .env \
  --platform linux/amd64 \
  --out ./nixpacks-build

echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${YELLOW}To run the application locally:${NC}"
echo -e "${GREEN}cd nixpacks-build && ./start${NC}"

echo -e "${YELLOW}To build a container image:${NC}"
echo -e "${GREEN}nixpacks build . --name konipai-crm --env-file .env --docker-file > Dockerfile${NC}"
echo -e "${GREEN}docker build -t konipai-crm:latest -f Dockerfile .${NC}"

echo -e "${YELLOW}To deploy to a platform that supports Nixpacks (like Render):${NC}"
echo -e "1. Push your code to a Git repository"
echo -e "2. Connect your repository to Render"
echo -e "3. Select 'Web Service' and set the 'Build Command' to 'nixpacks build .'"
echo -e "4. Set the 'Start Command' to './start'"
echo -e "5. Set the required environment variables"

echo -e "${GREEN}Build process completed!${NC}" 