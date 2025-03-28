# Konipai CRM

A comprehensive CRM system with email and WhatsApp integration.

## Project Setup

### Prerequisites

- Node.js 18+ and npm
- Docker (for containerized deployment)

### Local Development Setup

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd konipai-crm-trove
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` (if available)
   - Configure required environment variables

4. Start the development server:
```sh
npm run dev:all
```

This will start both the frontend development server and the email server concurrently.

## Running the Production Build

### Building the Application

1. Build the frontend and server:
```sh
npm run build:all
```

2. Start the application:

**On Linux/macOS:**
```sh
npm run start:app
```
or
```sh
./start-app.sh
```

**On Windows:**
```sh
npm run start
```
or
```sh
start-app.bat
```

The application will be available at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000 (or another port if 3000 is unavailable)

## Docker Deployment

### Building and Running with Docker

1. Build the Docker image:
```sh
docker build -t konipai-crm .
```

2. Run the container:
```sh
docker run -p 8080:8080 -p 3001:3001 -d konipai-crm
```

### Easypanel Deployment

1. Create a new service in Easypanel
2. Use the repository URL
3. Set the build configuration to use `Dockerfile.easypanel`
4. Configure the required environment variables
5. Deploy the service

## WhatsApp Integration Testing

To test the WhatsApp API integration:
```sh
npm run test:whatsapp
```

## Environment Variables

Key environment variables:

- `VITE_POCKETBASE_URL`: URL for PocketBase backend
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`: Email server configuration
- `VITE_WHATSAPP_API_URL`: WhatsApp API endpoint

## Technologies Used

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Express.js
- PocketBase
- Docker

## Project info

**URL**: https://lovable.dev/projects/8c2a47a1-fd6f-4453-837f-fd1f63b393bb

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8c2a47a1-fd6f-4453-837f-fd1f63b393bb) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8c2a47a1-fd6f-4453-837f-fd1f63b393bb) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
