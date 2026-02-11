
import { defineConfig, loadEnv } from 'vite';
// Import process explicitly to ensure type definitions for Node.js are correctly applied
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // 加载当前环境的所有变量
  // Fix: process.cwd() is now correctly typed
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    build: {
      outDir: 'dist',
      sourcemap: true,
      // 确保构建时对环境变量进行静态替换
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'framer-motion', 'lucide-react']
          }
        }
      }
    },
    // 显式定义全局常量，作为 import.meta.env 的双重保险
    define: {
      '__VITE_API_URL__': JSON.stringify(env.VITE_API_URL),
    }
  };
});
