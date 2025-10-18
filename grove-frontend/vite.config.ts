import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/v1/messages': {
        target: 'http://localhost:8080',
        // target: 'https://api.anthropic.com',
        changeOrigin: true,
        secure: false,
      },
      '/v1/chat/completions': {
        target: 'http://localhost:8080',
        // target: 'https://api.openai.com',
        changeOrigin: true,
        secure: false,
      },
      '/v1/task-mixture': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/v1/benchmark': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
      '/v1/model-centric': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1': {
        target: 'http://localhost:8080',
        // target: 'https://openrouter.ai',
        changeOrigin: true,
        secure: false,
      },
      '/weavy/v1': {
        target: 'http://localhost:8084',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
