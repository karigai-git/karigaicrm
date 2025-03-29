/**
 * Script to copy server files to the dist-server directory
 * This ensures all necessary files are included in the build
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Source and destination directories
const srcApiDir = path.join(rootDir, 'src', 'api');
const srcServerDir = path.join(rootDir, 'src', 'server');
const srcLibDir = path.join(rootDir, 'src', 'lib');
const destApiDir = path.join(rootDir, 'dist-server', 'api');
const destServerDir = path.join(rootDir, 'dist-server', 'server');
const destLibDir = path.join(rootDir, 'dist-server', 'lib');

/**
 * Recursively copy a directory
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read the source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  // Copy each entry
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

// Copy the source directories to the destination
console.log('Copying API files...');
copyDir(srcApiDir, destApiDir);

console.log('Copying server files...');
copyDir(srcServerDir, destServerDir);

console.log('Copying lib files...');
copyDir(srcLibDir, destLibDir);

console.log('All files copied successfully!'); 