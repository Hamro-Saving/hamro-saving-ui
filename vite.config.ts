import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  server: {
    port: parseInt(process.env.PORT || '5173'),
    allowedHosts: ['idealist-animator-snoring.ngrok-free.dev'],
    proxy: {
      '/api': {
        // 127.0.0.1, not localhost: macOS AirPlay Receiver holds *:7000, so anything
        // that does not arrive over loopback gets an empty 403 from AirTunes.
        target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:7000',
        changeOrigin: true,
      },
    },
  },
})
