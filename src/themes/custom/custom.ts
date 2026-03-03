// Custom Theme Template
// Rename this file to custom-theme.ts (or any name you prefer)
// Then set theme: "custom" in src/config.ts - it will work automatically!

export const customTheme = {
  primary: {
    50: "#ffffff",   // Pure white
    100: "#f8f8f8",
    200: "#e8e8e8",
    300: "#d0d0d0",
    400: "#a0a0a0",
    500: "#808080",  // Base gray
    600: "#606060",
    700: "#404040",
    800: "#202020",
    900: "#101010",
    950: "#000000"   // Pure black
  },
  highlight: {
    50: "#f0f8ff",   // Very light blue
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",  // Base light blue
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    950: "#082f49"
  }
};

// Usage in src/config.ts:
// theme: "custom",
// customTheme: customTheme
