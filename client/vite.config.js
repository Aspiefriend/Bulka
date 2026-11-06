import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import path from 'path';
import { fileURLToPath } from 'url';
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['project-test.ru'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  envDir: path.resolve(__dirname, '..'),
});
