/**
 * Development configuration
 * This file contains settings that are only active in development mode
 */

export const devConfig = {
  // Image handling
  images: {
    // Show placeholder images for missing assets in development
    showPlaceholders: true,
    // Log missing images to console in development
    logMissingImages: true,
    // Fallback image paths
    fallbacks: {
      posts: '/posts/attachments/placeholder.jpg',
      pages: '/pages/attachments/placeholder.jpg',
      default: '/posts/attachments/placeholder.jpg'
    }
  },
  
  // Content processing
  content: {
    // Continue processing even if some assets are missing
    continueOnMissingAssets: true,
    // Log content processing warnings
    logWarnings: false
  },
  
  // Error handling
  errors: {
    // Show detailed error information in development
    showDetails: true,
    // Continue build process even with non-critical errors
    continueOnNonCriticalErrors: true
  },
  
  // Tag handling
  tags: {
    // Gracefully handle missing or deleted tags in development
    handleMissingTags: true,
    // Log tag-related warnings in development
    logTagWarnings: false,
    // Continue processing even if some tags are missing
    continueOnMissingTags: true
  }
};

// Check if we're in development mode
export const isDev = import.meta.env.DEV;

// Get development configuration
export function getDevConfig() {
  return isDev ? devConfig : null;
}

// Check if a feature is enabled in development
export function isDevFeatureEnabled(feature: keyof typeof devConfig) {
  return isDev && devConfig[feature];
}
