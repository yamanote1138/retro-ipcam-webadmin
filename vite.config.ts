import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Prevent node-fetch from being bundled (digest-fetch will use browser fetch)
      'node-fetch': path.resolve(__dirname, './src/utils/fetch-stub.ts')
    }
  },
  server: {
    host: true, // Allow network access for mobile testing
    port: 5173
  },
  optimizeDeps: {
    exclude: ['node-fetch']
  }
})
