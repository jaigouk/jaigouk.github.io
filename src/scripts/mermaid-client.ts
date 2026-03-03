/**
 * Optimized client-side Mermaid initialization script
 * 
 * This script handles Mermaid diagram rendering with:
 * - Lazy loading using Intersection Observer
 * - Diagram caching to prevent re-rendering on theme changes
 * - Progressive loading with skeleton states
 * - Performance optimizations
 */

import { initializeMermaidOnLoad, handleThemeChange } from '../utils/mermaid';

// Initialize Mermaid when DOM is ready
initializeMermaidOnLoad();

// Make theme change handler globally available
if (typeof window !== 'undefined') {
  (window as any).handleMermaidThemeChange = handleThemeChange;
}
