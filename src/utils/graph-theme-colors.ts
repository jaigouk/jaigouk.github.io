/**
 * Utility functions for getting theme colors for graph components
 * This ensures consistent color usage across GraphModal and LocalGraph components
 */

export interface GraphThemeColors {
  // Node colors
  postFill: string;
  postStroke: string;
  postText: string;
  tagFill: string;
  tagStroke: string;
  tagText: string;
  
  // Link colors
  linkStroke: string;
  highlight: string;
  
  // Background colors
  background: string;
  backgroundSecondary: string;
}

/**
 * Get theme colors for graph components
 * This function reads CSS custom properties and provides fallbacks
 */
export function getGraphThemeColors(): GraphThemeColors {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  // Get CSS custom properties with fallbacks
  const getCSSVar = (varName: string, fallback: string): string => {
    const value = computedStyle.getPropertyValue(varName).trim();
    if (!value) return fallback;
    
    // Convert RGB format (e.g., "255 255 255") to hex format
    if (value.includes(' ')) {
      const rgbValues = value.split(' ').map(v => parseInt(v.trim()));
      if (rgbValues.length === 3 && rgbValues.every(v => !isNaN(v))) {
        const hex = rgbValues.map(v => v.toString(16).padStart(2, '0')).join('');
        return `#${hex}`;
      }
    }
    
    return value;
  };
  
  // Theme-aware color fallbacks
  const fallbacks = {
    light: {
      postFill: '#64748b',
      postStroke: '#475569', 
      postText: '#1e293b',
      tagFill: '#0284c7',
      tagStroke: '#0369a1',
      tagText: '#1e293b',
      linkStroke: '#64748b',
      highlight: '#0284c7',
      background: '#f8fafc',
      backgroundSecondary: '#f1f5f9'
    },
    dark: {
      postFill: '#e2e8f0',
      postStroke: '#cbd5e1',
      postText: '#f1f5f9', 
      tagFill: '#38bdf8',
      tagStroke: '#0284c7',
      tagText: '#f1f5f9',
      linkStroke: '#94a3b8',
      highlight: '#38bdf8',
      background: '#1e293b',
      backgroundSecondary: '#334155'
    }
  };
  
  const currentFallbacks = isDarkMode ? fallbacks.dark : fallbacks.light;
  
  return {
    // Post node colors
    postFill: getCSSVar('--color-primary-500', currentFallbacks.postFill),
    postStroke: getCSSVar('--color-primary-600', currentFallbacks.postStroke),
    postText: isDarkMode 
      ? getCSSVar('--color-primary-50', currentFallbacks.postText)
      : getCSSVar('--color-primary-900', currentFallbacks.postText),
    
    // Tag node colors  
    tagFill: getCSSVar('--color-highlight-400', currentFallbacks.tagFill),
    tagStroke: getCSSVar('--color-highlight-600', currentFallbacks.tagStroke),
    tagText: isDarkMode 
      ? getCSSVar('--color-primary-50', currentFallbacks.tagText)
      : getCSSVar('--color-primary-900', currentFallbacks.tagText),
    
    // Link colors
    linkStroke: getCSSVar('--color-primary-400', currentFallbacks.linkStroke),
    highlight: getCSSVar('--color-highlight-500', currentFallbacks.highlight),
    
    // Background colors
    background: isDarkMode 
      ? getCSSVar('--color-primary-800', currentFallbacks.background)
      : getCSSVar('--color-primary-50', currentFallbacks.background),
    backgroundSecondary: isDarkMode 
      ? getCSSVar('--color-primary-700', currentFallbacks.backgroundSecondary)
      : getCSSVar('--color-primary-100', currentFallbacks.backgroundSecondary)
  };
}

/**
 * Get theme colors for a specific theme (for testing or preview)
 * This is useful for theme switching animations or previews
 */
export function getGraphThemeColorsForTheme(themeName: string, isDarkMode: boolean): GraphThemeColors {
  // This could be extended to load specific theme colors
  // For now, we'll use the same logic as the main function
  return getGraphThemeColors();
}

/**
 * Convert hex color to RGB values for canvas operations
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB values to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Get contrasting text color for a given background color
 * Returns 'white' or 'black' based on luminance
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';
  
  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
