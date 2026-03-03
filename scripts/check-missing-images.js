#!/usr/bin/env node

/**
 * Script to check for missing images in content
 * Run with: node scripts/check-missing-images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Get all markdown files in content directory
function getAllMarkdownFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (item.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Extract image references from markdown content
function extractImageReferences(content) {
  const images = [];
  
  // Match markdown images ![alt](src)
  const markdownImages = content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [];
  for (const match of markdownImages) {
    const src = match.match(/!\[[^\]]*\]\(([^)]+)\)/)[1];
    images.push({ type: 'markdown', src, line: content.substring(0, content.indexOf(match)).split('\n').length });
  }
  
  // Match wikilink images ![[src]]
  const wikilinkImages = content.match(/!\[\[([^\]]+)\]\]/g) || [];
  for (const match of wikilinkImages) {
    const src = match.match(/!\[\[([^\]]+)\]\]/)[1];
    images.push({ type: 'wikilink', src, line: content.substring(0, content.indexOf(match)).split('\n').length });
  }
  
  // Match frontmatter images
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const imageMatch = frontmatter.match(/^image:\s*["']?([^"'\n]+)["']?/m);
    if (imageMatch) {
      images.push({ type: 'frontmatter', src: imageMatch[1], line: 1 });
    }
  }
  
  return images;
}

// Check if image exists
function checkImageExists(imageSrc, filePath) {
  // Handle different image path formats
  let imagePath = imageSrc;
  
  // Remove Obsidian brackets
  if (imagePath.startsWith('[[') && imagePath.endsWith(']]')) {
    imagePath = imagePath.slice(2, -2);
  }
  
  // Determine content type and folder structure
  const isPostsFile = filePath.includes('posts');
  const isPagesFile = filePath.includes('pages');
  const isProjectsFile = filePath.includes('projects');
  const isDocsFile = filePath.includes('docs');
  const isFolderBasedPost = filePath.endsWith('index.md') && isPostsFile;
  const isFolderBasedProject = filePath.endsWith('index.md') && isProjectsFile;
  const isFolderBasedDoc = filePath.endsWith('index.md') && isDocsFile;
  
  // 1. Check in the same folder as the markdown file (for folder-based content)
  if (isFolderBasedPost || isFolderBasedProject || isFolderBasedDoc) {
    const contentDir = path.dirname(filePath);
    const sameFolderPath = path.join(contentDir, imagePath);
    if (fs.existsSync(sameFolderPath)) {
      return { exists: true, path: sameFolderPath };
    }
    
    // Check in /attachments/ subfolder within the content folder
    const imagesSubfolderPath = path.join(contentDir, 'images', imagePath);
    if (fs.existsSync(imagesSubfolderPath)) {
      return { exists: true, path: imagesSubfolderPath };
    }
  }
  
  // 2. Check in general images directory for each content type
  if (isPostsFile) {
    const generalImagesPath = path.join(projectRoot, 'src', 'content', 'posts', 'images', imagePath);
    if (fs.existsSync(generalImagesPath)) {
      return { exists: true, path: generalImagesPath };
    }
  }
  
  if (isPagesFile) {
    const generalImagesPath = path.join(projectRoot, 'src', 'content', 'pages', 'images', imagePath);
    if (fs.existsSync(generalImagesPath)) {
      return { exists: true, path: generalImagesPath };
    }
  }
  
  if (isProjectsFile) {
    const generalImagesPath = path.join(projectRoot, 'src', 'content', 'projects', 'images', imagePath);
    if (fs.existsSync(generalImagesPath)) {
      return { exists: true, path: generalImagesPath };
    }
  }
  
  if (isDocsFile) {
    const generalImagesPath = path.join(projectRoot, 'src', 'content', 'docs', 'images', imagePath);
    if (fs.existsSync(generalImagesPath)) {
      return { exists: true, path: generalImagesPath };
    }
  }
  
  // 3. Check in public directory (for synced images)
  if (isFolderBasedPost) {
    const postSlug = path.basename(path.dirname(filePath));
    const publicPath = path.join(projectRoot, 'public', 'posts', postSlug, imagePath);
    if (fs.existsSync(publicPath)) {
      return { exists: true, path: publicPath };
    }
  }
  
  if (isFolderBasedProject) {
    const projectSlug = path.basename(path.dirname(filePath));
    const publicPath = path.join(projectRoot, 'public', 'projects', projectSlug, imagePath);
    if (fs.existsSync(publicPath)) {
      return { exists: true, path: publicPath };
    }
  }
  
  if (isFolderBasedDoc) {
    const docSlug = path.basename(path.dirname(filePath));
    const publicPath = path.join(projectRoot, 'public', 'docs', docSlug, imagePath);
    if (fs.existsSync(publicPath)) {
      return { exists: true, path: publicPath };
    }
  }
  
  // Handle absolute paths (starting with /)
  if (imagePath.startsWith('/')) {
    const publicPath = path.join(projectRoot, 'public', imagePath);
    if (fs.existsSync(publicPath)) {
      return { exists: true, path: publicPath };
    }
  }
  
  // Handle relative paths from public directory
  const publicPath = path.join(projectRoot, 'public', imagePath);
  if (fs.existsSync(publicPath)) {
    return { exists: true, path: publicPath };
  }
  
  // Handle external URLs (don't check these)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return { exists: true, path: imagePath };
  }
  
  return { exists: false, path: imagePath };
}

// Main function
function main() {
  console.log('🔍 Checking for missing images...\n');
  
  const contentDir = path.join(projectRoot, 'src', 'content');
  const markdownFiles = getAllMarkdownFiles(contentDir);
  
  let totalImages = 0;
  let missingImages = 0;
  const missingImageDetails = [];
  
  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const images = extractImageReferences(content);
    
    for (const image of images) {
      totalImages++;
      const result = checkImageExists(image.src, filePath);
      
      if (!result.exists) {
        missingImages++;
        const relativePath = path.relative(projectRoot, filePath);
        missingImageDetails.push({
          file: relativePath,
          line: image.line,
          type: image.type,
          src: image.src,
          expectedPath: result.path
        });
      }
    }
  }
  
  // Report results
  console.log(`📊 Summary:`);
  console.log(`   Total images: ${totalImages}`);
  console.log(`   Missing images: ${missingImages}`);
  console.log(`   Found images: ${totalImages - missingImages}\n`);
  
  if (missingImages > 0) {
    console.log('❌ Missing images:');
    for (const detail of missingImageDetails) {
      console.log(`   ${detail.file}:${detail.line} (${detail.type})`);
      console.log(`     ${detail.src}`);
      console.log(`     Expected: ${detail.expectedPath}\n`);
    }
    
    console.log('💡 Tips:');
    console.log('   - In development mode, missing images will show placeholder images');
    console.log('   - Check if images are in the correct folder for folder-based posts');
    console.log('   - Verify image paths match exactly (case-sensitive)');
    console.log('   - For Obsidian wikilinks, ensure the image exists in the same folder');
  } else {
    console.log('✅ All images found!');
  }
}

main();
