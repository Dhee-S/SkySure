import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure 'base' is NOT set to /SkySure/ for Vercel
  base: '/',
  build: {
    chunkSizeWarningLimit: 2000,
  }
})