import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import { visualizer } from 'rollup-plugin-visualizer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,        
      filename: 'dist/stats.html',
    }),
  ],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
  },
  server: {
    fs: {
      allow: [path.join(process.cwd(), 'public/tiles'), process.cwd()],
    },
    watch: {
      ignored: ['**/public/tiles/**'], // не следить за тайлами
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/media': {
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    // include: ['large-library'], // при необходимости
  },
  build: {
    assetsInlineLimit: 0, // не инлайнить ассеты
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: {
          // пример для картографической библиотеки
          // 'map-vendor': ['leaflet', 'react-leaflet'],
        },
      },
    },
    minify: 'esbuild',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  base: '/',
  envPrefix: 'VITE_',
});