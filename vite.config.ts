import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split vendor libraries into separate chunks for better caching
        manualChunks: {
          // React and related
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // Increase chunk size warning limit slightly (optional)
    chunkSizeWarningLimit: 600,
  },
})
