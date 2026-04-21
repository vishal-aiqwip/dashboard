import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          'vendor-react': ['react', 'react-dom', 'react-router'],
          // UI libraries
          'vendor-ui': ['@tabler/icons-react', 'lucide-react', 'motion', 'recharts'],
          // Syntax highlighting (very large)
          'vendor-shiki': ['shiki'],
          // Data & state management
          'vendor-data': ['@tanstack/react-query', '@tanstack/react-table', 'react-redux', '@reduxjs/toolkit', 'axios'],
          // Form & validation
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
  preview: {
      port: 3006,
      strictPort: true,
      host: true,
      allowedHosts: true  // Allow all hosts since we're behind nginx proxy
    },
    server: {
      host: true,
      allowedHosts: true  // Allow all hosts since we're behind nginx proxy
    }
})
