#!/usr/bin/env node

/**
 * Get version information for Astro Modular theme
 * This script provides version information for use in other scripts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Get the current theme version
 */
export function getThemeVersion() {
  try {
    // Try to read from VERSION file first
    const versionFile = join(process.cwd(), 'VERSION');
    const version = readFileSync(versionFile, 'utf8').trim();
    return version;
  } catch (error) {
    try {
      // Fallback to package.json
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      return packageJson.version || '0.1.0';
    } catch (error) {
      return '0.1.0';
    }
  }
}

/**
 * Get the theme name
 */
export function getThemeName() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    return packageJson.name || 'astro-modular';
  } catch (error) {
    return 'astro-modular';
  }
}

/**
 * Get the full theme identifier (name@version)
 */
export function getThemeIdentifier() {
  return `${getThemeName()}@${getThemeVersion()}`;
}

/**
 * Update the version in both VERSION file and package.json
 */
export function updateVersion(newVersion) {
  try {
    // Update VERSION file
    writeFileSync('VERSION', newVersion + '\n');
    
    // Update package.json
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    packageJson.version = newVersion;
    writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    
    return true;
  } catch (error) {
    console.error('Failed to update version:', error.message);
    return false;
  }
}

// If run directly, output the version
if (process.argv[1] && process.argv[1].endsWith('get-version.js')) {
  console.log(getThemeVersion());
}
