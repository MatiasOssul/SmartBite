import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@js': resolve(__dirname, 'src/js'),
      '@styles': resolve(__dirname, 'src/styles'),
    },
  },

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.html'),
        main: resolve(__dirname, 'src/main.html'),
        history: resolve(__dirname, 'src/history.html'),
        profile: resolve(__dirname, 'src/profile.html'),
        biteplus: resolve(__dirname, 'src/biteplus.html'),
        support: resolve(__dirname, 'src/support.html'),
        uikit: resolve(__dirname, 'src/ui-kit.html'),
      },
    },
  },

  server: {
    port: 5173,
    open: '/index.html',
    // Proxies /api/* to FastAPI during development — mirrors production setup
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
