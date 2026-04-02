import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      // Dev: browser calls same origin (Vite); Vite forwards to API on this machine.
      // Works from phone at http://<pc-ip>:5173 without exposing API IP in .env
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
})
