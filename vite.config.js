import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@supabase/supabase-js'],
          charts: ['chart.js'],
          utils: ['flatpickr']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js', 'chart.js', 'flatpickr']
  }
})