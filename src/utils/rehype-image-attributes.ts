import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Rehype plugin to add loading attributes and optimize image paths in markdown content
 * Adds lazy loading attributes and converts image paths to WebP versions when available
 */
export function rehypeImageAttributes() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'img') {
        const properties = node.properties || {};
        const src = (properties.src as string) || '';
        
        // Convert image paths to WebP if available
        // The sync script generates WebP versions of JPG/PNG files
        // Only convert if path doesn't already end with .webp (remarkFolderImages may have already converted it)
        if (src && typeof src === 'string' && !src.startsWith('http') && !src.toLowerCase().endsWith('.webp') && !src.toLowerCase().endsWith('.svg')) {
          // Check if this is an image format that would have been converted to WebP
          if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(src)) {
            // Replace extension with .webp
            // Note: remarkFolderImages should have already set the correct path with collection prefix
            // This is a fallback for any images that weren't processed by remarkFolderImages
            properties.src = src.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp');
          }
        }
        
        // Add loading="lazy" if not already set
        if (!properties.loading) {
          properties.loading = 'lazy';
        }
        
        // Add decoding="async" if not already set
        if (!properties.decoding) {
          properties.decoding = 'async';
        }
        
        // Ensure alt text is present
        if (!properties.alt) {
          properties.alt = '';
        }
      }
    });
  };
}

export default rehypeImageAttributes;