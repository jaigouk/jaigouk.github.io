// Theme utilities for dark/light mode management

export type Theme = 'light' | 'dark';

// Get system theme preference
export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
}

// Get stored theme preference
export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('theme');
  return stored === 'dark' || stored === 'light' ? stored : null;
}

// Get current theme (stored preference or system preference)
export function getCurrentTheme(): Theme {
  return getStoredTheme() || getSystemTheme();
}

// Set theme and store preference
export function setTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('theme', theme);
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  
  // Favicon is handled by system theme detection, not manual theme changes
  
  // Dispatch custom event for theme change
  window.dispatchEvent(new CustomEvent('themechange', { 
    detail: { theme } 
  }));
}

// Toggle between light and dark theme
export function toggleTheme() {
  const current = getCurrentTheme();
  const newTheme = current === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
}

// Initialize theme on page load
export function initializeTheme() {
  if (typeof window === 'undefined') return;
  
  const theme = getCurrentTheme();
  document.documentElement.classList.add(theme);
  // Favicon is handled by system theme detection, not manual theme changes
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      // Only update if no stored preference
      if (!getStoredTheme()) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
}

// Favicon is now handled by system theme detection in BaseLayout.astro
// This ensures favicon matches browser's system preference, not user's manual theme choice

// Generate theme-based CSS custom properties
export function generateThemeCSS(theme: Theme): string {
  const lightTheme = `
    --color-background: 255 255 255;
    --color-foreground: 15 23 42;
    --color-muted: 248 250 252;
    --color-muted-foreground: 100 116 139;
    --color-border: 226 232 240;
    --color-input: 255 255 255;
    --color-primary: 15 23 42;
    --color-primary-foreground: 248 250 252;
    --color-secondary: 241 245 249;
    --color-secondary-foreground: 15 23 42;
    --color-accent: 241 245 249;
    --color-accent-foreground: 15 23 42;
    --color-destructive: 239 68 68;
    --color-destructive-foreground: 248 250 252;
    --color-ring: 15 23 42;
  `;

  const darkTheme = `
    --color-background: 2 6 23;
    --color-foreground: 248 250 252;
    --color-muted: 15 23 42;
    --color-muted-foreground: 148 163 184;
    --color-border: 30 41 59;
    --color-input: 15 23 42;
    --color-primary: 248 250 252;
    --color-primary-foreground: 15 23 42;
    --color-secondary: 30 41 59;
    --color-secondary-foreground: 248 250 252;
    --color-accent: 30 41 59;
    --color-accent-foreground: 248 250 252;
    --color-destructive: 220 38 38;
    --color-destructive-foreground: 248 250 252;
    --color-ring: 212 212 216;
  `;

  return theme === 'dark' ? darkTheme : lightTheme;
}

// Get theme-aware color value
export function getThemeColor(colorName: string, theme?: Theme): string {
  const currentTheme = theme || getCurrentTheme();
  
  const colors = {
    light: {
      background: 'rgb(255 255 255)',
      foreground: 'rgb(15 23 42)',
      muted: 'rgb(248 250 252)',
      border: 'rgb(226 232 240)',
      accent: 'rgb(14 165 233)',
    },
    dark: {
      background: 'rgb(2 6 23)',
      foreground: 'rgb(248 250 252)',
      muted: 'rgb(15 23 42)',
      border: 'rgb(30 41 59)',
      accent: 'rgb(56 189 248)',
    }
  };
  
  return colors[currentTheme]?.[colorName as keyof typeof colors.light] || '';
}

// Check if dark mode is enabled
export function isDarkMode(): boolean {
  return getCurrentTheme() === 'dark';
}

// Theme-aware class utility
export function themeClass(lightClass: string, darkClass: string, theme?: Theme): string {
  const currentTheme = theme || getCurrentTheme();
  return currentTheme === 'dark' ? darkClass : lightClass;
}

// Add smooth transition for theme changes
export function addThemeTransition() {
  if (typeof window === 'undefined') return;
  
  document.documentElement.style.setProperty(
    'transition', 
    'color 0.2s ease-in-out, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out'
  );
  
  // Remove transition after a short delay to avoid affecting other animations
  setTimeout(() => {
    document.documentElement.style.removeProperty('transition');
  }, 200);
}

// Create theme-aware media query
export function createThemeMediaQuery(callback: (isDark: boolean) => void) {
  if (typeof window === 'undefined') return;
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };
  
  mediaQuery.addEventListener('change', handler);
  
  // Return cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}
