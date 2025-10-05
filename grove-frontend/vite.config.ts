import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
    },
  },
});
