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
const serverConfigSrc = path.join(rootDir, 'server.config.ts');
const serverConfigDest = path.join(rootDir, 'dist-server', 'server.config.js');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`Created directory: ${destDir}`);
}

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

// Step 3: Create a simple server.js entry point in the dist-server/server directory
const serverJsPath = path.join(destDir, 'server', 'server.js');
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

// Step 4: Update package.json scripts if needed
console.log('Backend build completed successfully!'); 