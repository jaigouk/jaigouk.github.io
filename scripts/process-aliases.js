#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple logging utility
const isDev = process.env.NODE_ENV !== 'production';
const log = {
  info: (...args) => isDev && console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args)
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define content directories to process
const CONTENT_DIRS = [
  'src/content/pages',
  'src/content/posts',
  'src/content/projects',
  'src/content/docs'
];

// Function to parse frontmatter from markdown content
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: null, content: content };
  }
  
  const frontmatterText = match[1];
  const body = match[2];
  
  // Parse YAML-like frontmatter (simple parser)
  const frontmatter = {};
  const lines = frontmatterText.split('\n');
  let currentKey = null;
  let currentValue = [];
  let inArray = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }
    
    if (trimmed.includes(':') && (!inArray || !trimmed.startsWith('  '))) {
      // Save previous key-value pair
      if (currentKey) {
        if (currentValue.length === 1) {
          frontmatter[currentKey] = currentValue[0];
        } else {
          frontmatter[currentKey] = currentValue;
        }
      }
      
      // Start new key-value pair
      const colonIndex = trimmed.indexOf(':');
      currentKey = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      
      // Reset array state when starting a new key
      inArray = false;
      
      if (value.startsWith('[')) {
        // Array value
        inArray = true;
        currentValue = [];
        if (value !== '[') {
          // Single line array
          const arrayContent = value.substring(1, value.endsWith(']') ? value.length - 1 : value.length);
          if (arrayContent.trim()) {
            currentValue = arrayContent.split(',').map(item => {
              const trimmed = item.trim();
              if (trimmed.startsWith('"[[') && trimmed.endsWith(']]"')) {
                // Keep quotes for Obsidian bracket syntax
                return trimmed;
              } else {
                // Remove quotes for regular values
                return trimmed.replace(/^["']|["']$/g, '');
              }
            });
          }
          inArray = false;
        }
      } else if (value) {
        // Single value - preserve quotes for Obsidian bracket syntax
        if (value.startsWith('"[[') && value.endsWith(']]"')) {
          // Keep quotes for Obsidian bracket syntax
          currentValue = [value];
        } else {
          // Remove quotes for regular values
          currentValue = [value.replace(/^["']|["']$/g, '')];
        }
      } else {
        // Empty value, might be start of array
        currentValue = [];
        inArray = true;
      }
    } else if (inArray && trimmed.startsWith('-')) {
      // Array item - preserve quotes for Obsidian bracket syntax
      const item = trimmed.substring(1).trim();
      if (item.startsWith('"[[') && item.endsWith(']]"')) {
        // Keep quotes for Obsidian bracket syntax
        currentValue.push(item);
      } else {
        // Remove quotes for regular values
        currentValue.push(item.replace(/^["']|["']$/g, ''));
      }
    } else if (inArray && trimmed === ']') {
      // End of array
      inArray = false;
    } else if (currentKey && !inArray) {
      // Continuation of single value
      currentValue = [currentValue[0] + ' ' + trimmed];
    }
  }
  
  // Save last key-value pair
  if (currentKey) {
    if (currentValue.length === 1) {
      frontmatter[currentKey] = currentValue[0];
    } else {
      frontmatter[currentKey] = currentValue;
    }
  }
  
  return { frontmatter, content: body };
}

// Function to convert frontmatter back to YAML string
function frontmatterToString(frontmatter) {
  const lines = ['---'];
  
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        // Preserve quotes for Obsidian bracket syntax in arrays
        if (typeof item === 'string' && item.startsWith('"[[') && item.endsWith(']]"')) {
          lines.push(`  - ${item}`);
        } else {
          lines.push(`  - ${item}`);
        }
      }
    } else {
      // Preserve quotes for Obsidian bracket syntax in single values
      if (typeof value === 'string' && value.startsWith('"[[') && value.endsWith(']]"')) {
        lines.push(`${key}: ${value}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
  }
  
  lines.push('---');
  return lines.join('\n');
}

// Function to get the current slug from a file path
function getCurrentSlug(filePath) {
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Extract slug based on content type
  if (normalizedPath.includes('/posts/')) {
    let postPath = normalizedPath.replace(/^.*\/posts\//, '').replace(/\.md$/, '');
    if (postPath.endsWith('/index')) {
      postPath = postPath.replace('/index', '');
    }
    return postPath;
  } else if (normalizedPath.includes('/projects/')) {
    let projectPath = normalizedPath.replace(/^.*\/projects\//, '').replace(/\.md$/, '');
    if (projectPath.endsWith('/index')) {
      projectPath = projectPath.replace('/index', '');
    }
    return projectPath;
  } else if (normalizedPath.includes('/docs/')) {
    let docPath = normalizedPath.replace(/^.*\/docs\//, '').replace(/\.md$/, '');
    if (docPath.endsWith('/index')) {
      docPath = docPath.replace('/index', '');
    }
    return docPath;
  } else if (normalizedPath.includes('/pages/')) {
    let pagePath = normalizedPath.replace(/^.*\/pages\//, '').replace(/\.md$/, '');
    if (pagePath.endsWith('/index')) {
      pagePath = pagePath.replace('/index', '');
    }
    if (pagePath === 'index') {
      return 'index';
    }
    return pagePath;
  }
  
  return null;
}

// Function to process a single markdown file
async function processMarkdownFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, content: body } = parseFrontmatter(content);
    
    if (!frontmatter || !frontmatter.aliases) {
      return false; // No aliases to process
    }
    
    // Get the current slug for this file
    const currentSlug = getCurrentSlug(filePath);
    
    // Ensure aliases is an array
    const aliasesArray = Array.isArray(frontmatter.aliases) 
      ? frontmatter.aliases 
      : [frontmatter.aliases];
    
    // Ensure aliases are in the correct format (no leading slash) and filter out self-aliases
    const cleanAliases = aliasesArray
      .map(alias => alias.startsWith('/') ? alias.substring(1) : alias)
      .filter(alias => {
        // Remove aliases that match the current slug (prevents self-redirects)
        if (currentSlug && alias === currentSlug) {
          log.warn(`⚠️  Removing self-alias "${alias}" from ${filePath} (matches current slug)`);
          return false;
        }
        return true;
      });
    
    // If no valid aliases remain, remove the aliases field entirely
    if (cleanAliases.length === 0) {
      delete frontmatter.aliases;
    } else {
      // Update frontmatter with cleaned aliases
      frontmatter.aliases = cleanAliases.length === 1 ? cleanAliases[0] : cleanAliases;
    }
    
    // Only write back if we made changes (removed aliases or cleaned them)
    const originalAliasesCount = aliasesArray.length;
    const hadChanges = cleanAliases.length !== originalAliasesCount || 
                       (cleanAliases.length === 0 && originalAliasesCount > 0);
    
    if (hadChanges) {
      // Rebuild the file content
      const newFrontmatter = frontmatterToString(frontmatter);
      const newContent = `${newFrontmatter}\n${body}`;
      
      // Write back to file
      await fs.writeFile(filePath, newContent, 'utf-8');
    }
    
    return { processed: hadChanges, aliases: cleanAliases.length };
  } catch (error) {
    log.error(`❌ Error processing ${filePath}:`, error.message);
    return { processed: false, aliases: 0 };
  }
}

// Function to process all markdown files in a directory (including folder-based content)
async function processDirectory(dirPath) {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    let processedCount = 0;
    let totalAliases = 0;
    
    for (const file of files) {
      if (file.isDirectory()) {
        // Handle folder-based content (e.g., folder-name/index.md)
        const folderPath = path.join(dirPath, file.name);
        try {
          const indexPath = path.join(folderPath, 'index.md');
          await fs.access(indexPath);
          const result = await processMarkdownFile(indexPath);
          if (result.processed) {
            processedCount++;
            totalAliases += result.aliases;
          }
        } catch (error) {
          // index.md doesn't exist in this folder, skip
        }
      } else if (file.isFile() && file.name.endsWith('.md')) {
        // Handle single-file content
        const filePath = path.join(dirPath, file.name);
        const result = await processMarkdownFile(filePath);
        if (result.processed) {
          processedCount++;
          totalAliases += result.aliases;
        }
      }
    }
    
    return { processedCount, totalAliases };
  } catch (error) {
    log.error(`❌ Error processing directory ${dirPath}:`, error.message);
    return { processedCount: 0, totalAliases: 0 };
  }
}

// Main function
async function processAllAliases() {
  log.info('🔄 Processing aliases and converting to redirect_from...');
  
  const projectRoot = path.join(__dirname, '..');
  let totalProcessed = 0;
  let totalAliases = 0;
  
  for (const dir of CONTENT_DIRS) {
    const fullPath = path.join(projectRoot, dir);
    
    try {
      await fs.access(fullPath);
      const result = await processDirectory(fullPath);
      totalProcessed += result.processedCount;
      totalAliases += result.totalAliases;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        log.error(`❌ Error accessing directory ${dir}:`, error.message);
      }
    }
  }
  
  if (totalProcessed > 0) {
    log.info(`📁 Processing pages directory...`);
    log.info(`📁 Processing posts directory...`);
    log.info(`📁 Processing projects directory...`);
    log.info(`📁 Processing docs directory...`);
    log.info(`   Processed ${totalProcessed} files with ${totalAliases} aliases`);
  }
  
  log.info(`🎉 Alias processing complete! Processed ${totalProcessed} files.`);
}

// Run the script
processAllAliases();
