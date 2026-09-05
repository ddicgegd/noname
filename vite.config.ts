import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: process.env.DISABLE_HMR === 'true' ? 3000 : 3999,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching on store files, data caches, and JSON files to prevent unwanted reloads
      watch: {
        ignored: [
          '**/.cart-store.json',
          '**/.cart-store.json*',
          '**/.data/**',
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/*.json',
        ],
      },
    },
  };
});
