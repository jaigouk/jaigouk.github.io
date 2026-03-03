import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "copy-content-images",
      generateBundle() {
        // This will be handled by Astro build process
      }
    }
  ],
  build: {
    // Enable asset compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['swup'],
          utils: ['fuse.js']
        }
      }
    }
  },
  server: {
    hmr: false
  },
  preview: {
    allowedHosts: [
      '7c7d17a5-9e7a-489b-81ee-2831ec9efa37-00-1hzc8ugx94cy6.janeway.replit.dev'
    ]
  }
});
