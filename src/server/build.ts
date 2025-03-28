import { build } from 'esbuild';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create output directory if it doesn't exist
const outDir = './dist-server';
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

// Build the server files
async function buildServer() {
  try {
    console.log('🔨 Building server code...');
    
    await build({
      entryPoints: ['src/server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outdir: 'dist-server/server',
      format: 'esm',
      sourcemap: true,
      minify: false,
      define: {
        // Define environment variables at build time
        'import.meta.env.VITE_POCKETBASE_URL': JSON.stringify(process.env.VITE_POCKETBASE_URL || ''),
        'import.meta.env.POCKETBASE_ADMIN_EMAIL': JSON.stringify(process.env.POCKETBASE_ADMIN_EMAIL || ''),
        'import.meta.env.POCKETBASE_ADMIN_PASSWORD': JSON.stringify(process.env.POCKETBASE_ADMIN_PASSWORD || ''),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY || ''),
      },
    });
    
    // Also build lib files that are needed for the server
    await build({
      entryPoints: ['src/lib/pocketbase.ts', 'src/lib/gemini.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outdir: 'dist-server/lib',
      format: 'esm',
      sourcemap: true,
      minify: false,
      define: {
        // Define environment variables at build time
        'import.meta.env.VITE_POCKETBASE_URL': JSON.stringify(process.env.VITE_POCKETBASE_URL || ''),
        'import.meta.env.POCKETBASE_ADMIN_EMAIL': JSON.stringify(process.env.POCKETBASE_ADMIN_EMAIL || ''),
        'import.meta.env.POCKETBASE_ADMIN_PASSWORD': JSON.stringify(process.env.POCKETBASE_ADMIN_PASSWORD || ''),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY || ''),
      },
    });
    
    console.log('✅ Server build completed successfully!');
  } catch (error) {
    console.error('❌ Server build failed:', error);
    process.exit(1);
  }
}

buildServer(); 