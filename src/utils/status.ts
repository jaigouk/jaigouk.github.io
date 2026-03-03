/**
 * Utility functions for handling project status values
 */

export type ProjectStatus = 'in-progress' | 'completed' | string;

/**
 * Normalizes status values to handle case variations and common formats
 * @param status - The status value from frontmatter
 * @returns Normalized status value
 */
export function normalizeStatus(status: string | null | undefined): string | null {
  if (!status || status.trim() === '') {
    return null;
  }

  const normalized = status.toLowerCase().trim();
  
  // Handle common variations for in-progress
  if (normalized === 'in progress' || normalized === 'in-progress' || normalized === 'inprogress') {
    return 'in-progress';
  }
  
  // Handle common variations for completed
  if (normalized === 'completed' || normalized === 'complete' || normalized === 'done' || normalized === 'finished') {
    return 'completed';
  }
  
  // Return the original value for any other status (like "On Hold", "Paused", etc.)
  return status;
}

/**
 * Gets the display text for a status value
 * @param status - The normalized status value
 * @returns Display text for the status
 */
export function getStatusDisplayText(status: string | null): string {
  if (!status) return '';
  
  switch (status) {
    case 'in-progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      // Return the original status as-is for custom values
      return status;
  }
}

/**
 * Checks if a status should be displayed with special styling
 * @param status - The normalized status value
 * @returns Whether the status has predefined styling
 */
export function hasStatusStyling(status: string | null): boolean {
  if (!status) return false;
  return status === 'in-progress' || status === 'completed';
}

/**
 * Gets the CSS classes for status styling
 * @param status - The normalized status value
 * @returns CSS classes for the status badge
 */
export function getStatusClasses(status: string | null): string {
  if (!status) return '';
  
  if (status === 'completed') {
    return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
  }
  
  if (status === 'in-progress') {
    return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
  }
  
  // For custom status values, use neutral theme colors
  return 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-200 border border-primary-200 dark:border-primary-600';
}
