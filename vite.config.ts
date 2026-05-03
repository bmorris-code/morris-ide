import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          // Monaco editor — by far the largest dep
          'monaco-editor': ['monaco-editor', '@monaco-editor/react'],
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // AI & syntax
          'ai-vendor': ['groq-sdk', 'react-syntax-highlighter'],
          // UI utilities
          'ui-vendor': ['lucide-react', 'zustand'],
        }
      }
    }
  },
  base: './' // Use relative paths for Electron
})
