import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  envPrefix: ['VITE_', 'API_'],
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})
