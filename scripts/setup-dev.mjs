import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const astroCacheDir = path.join(projectRoot, '.astro');
const viteCacheDir = path.join(projectRoot, 'node_modules', '.vite');

console.log('⚙️ Setting up development environment...');

// Ensure .astro directory exists
if (!existsSync(astroCacheDir)) {
  console.log(`Creating .astro directory: ${astroCacheDir}`);
  mkdirSync(astroCacheDir, { recursive: true });
} else {
  console.log(`.astro directory already exists: ${astroCacheDir}`);
}

// Ensure node_modules/.vite directory exists
if (!existsSync(viteCacheDir)) {
  console.log(`Creating node_modules/.vite directory: ${viteCacheDir}`);
  mkdirSync(viteCacheDir, { recursive: true });
} else {
  console.log(`node_modules/.vite directory already exists: ${viteCacheDir}`);
}

// Clean up potentially problematic cache files
const filesToClean = [
  path.join(astroCacheDir, 'data-store.json'),
  path.join(astroCacheDir, 'data-store.json.tmp'),
  path.join(astroCacheDir, 'content-assets.mjs'),
  path.join(astroCacheDir, 'content-assets.mjs.tmp'),
  path.join(viteCacheDir, 'deps'),
  path.join(viteCacheDir, 'deps_temp_*'), // Wildcard for temporary deps folders
];

filesToClean.forEach(fileOrDir => {
  try {
    if (existsSync(fileOrDir)) {
      console.log(`Cleaning up: ${fileOrDir}`);
      rmSync(fileOrDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Failed to clean up ${fileOrDir}: ${error.message}`);
  }
});

console.log('✅ Development environment setup complete.');
