import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Решение для локальных тайлов
  server: {
    fs: {
      // Разрешаем обслуживать файлы из папки tiles
      allow: [
        // Путь к вашей папке с тайлами (абсолютный или относительный)
        path.join(process.cwd(), 'public/tiles'),
        // Дополнительные пути при необходимости
        process.cwd()
      ]
    }
  },
  build: {
    // Настройки для корректного включения тайлов в сборку
    assetsInlineLimit: 0, // Отключаем инлайнинг изображений
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]' // Сохраняем оригинальные имена файлов
      }
    }
  },
  // Для корректных путей в production
  base: './'
});