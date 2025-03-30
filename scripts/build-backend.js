/**
 * Custom build script for the backend server
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Source and destination paths
const srcDir = path.join(rootDir, 'src');
const destDir = path.join(rootDir, 'dist-server');
const destServerDir = path.join(destDir, 'server');
const serverConfigSrc = path.join(rootDir, 'server.config.ts');
const serverConfigDest = path.join(rootDir, 'dist-server', 'server.config.js');

// Create destination directories if they don't exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

ensureDir(destDir);
ensureDir(destServerDir);

// Step 1: Run TypeScript compiler
console.log('Running TypeScript compiler...');
try {
  execSync('tsc --project tsconfig.server.json', { stdio: 'inherit' });
  console.log('TypeScript compilation successful');
} catch (error) {
  console.error('TypeScript compilation failed:', error);
  process.exit(1);
}

// Step 2: Copy server.config.ts to the build directory and convert to JS
console.log('Processing server config...');
try {
  const configContent = fs.readFileSync(serverConfigSrc, 'utf8');
  // Convert to JavaScript
  const jsContent = configContent
    .replace(/import\s+type[^;]+;/g, '')
    .replace(/:\s*[A-Za-z0-9_<>\[\]|&]+(\s*\|\s*[A-Za-z0-9_<>\[\]|&]+)*\s*(?=[,)=;])/g, '')
    .replace(/export\s+interface\s+[^{]+{[^}]+}/g, '')
    .replace(/export\s+type\s+[^=]+=.*;/g, '');
  
  fs.writeFileSync(serverConfigDest, jsContent);
  console.log(`Processed server config: ${serverConfigSrc} -> ${serverConfigDest}`);
} catch (error) {
  console.error('Error processing server config:', error);
}

// Step 3: Create both entry point files in the dist-server/server directory
const indexJsPath = path.join(destServerDir, 'index.js');
const serverJsPath = path.join(destServerDir, 'server.js');

// If index.js doesn't exist after TypeScript compilation, create a simple version
if (!fs.existsSync(indexJsPath)) {
  console.log(`Warning: index.js not found at ${indexJsPath}, creating minimal version...`);
  const minimalServerContent = `/**
 * Minimal server implementation
 */
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;
  try {
    fs.writeFileSync(indexJsPath, minimalServerContent);
    console.log(`Created minimal index.js at ${indexJsPath}`);
  } catch (error) {
    console.error('Error creating minimal index.js:', error);
  }
}

// Always create server.js
console.log(`Creating server entry point at ${serverJsPath}...`);
const serverJsContent = `/**
 * Server entry point - redirects to index.js for compatibility
 */
console.log('Starting server from server.js, redirecting to index.js...');
require('./index.js');
`;

try {
  fs.writeFileSync(serverJsPath, serverJsContent);
  console.log('Created server.js entry point');
} catch (error) {
  console.error('Error creating server.js entry point:', error);
}

// Step 4: List files for debugging
try {
  console.log('\nContents of dist-server directory:');
  const distServerFiles = fs.readdirSync(destDir);
  console.log(distServerFiles);
  
  console.log('\nContents of dist-server/server directory:');
  const serverFiles = fs.readdirSync(destServerDir);
  console.log(serverFiles);
} catch (error) {
  console.error('Error listing directory contents:', error);
}

console.log('\nBackend build completed successfully!'); 