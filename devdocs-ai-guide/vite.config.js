import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // React Compiler (auto-memoization). plugin-react v6 has no `babel` option;
    // the compiler runs through @rolldown/plugin-babel with the official preset.
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('phase1Content')) return 'content-phase1';
          if (id.includes('phase2Content')) return 'content-phase2';
          if (id.includes('phase3Content')) return 'content-phase3';
          if (id.includes('phase4Content')) return 'content-phase4';
          if (id.includes('interviewQuestionsData')) return 'content-interview';
          if (id.includes('moduleQuizzesData')) return 'content-quizzes';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix';
          }
          if (id.includes('node_modules/react-syntax-highlighter')) {
            return 'vendor-highlighter';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (
            id.includes('node_modules/react-markdown') ||
            id.includes('node_modules/remark') ||
            id.includes('node_modules/rehype') ||
            id.includes('node_modules/micromark') ||
            id.includes('node_modules/unified')
          ) {
            return 'vendor-markdown';
          }
          if (id.includes('node_modules/canvas-confetti')) {
            return 'vendor-confetti';
          }
        },
      },
    },
  },
})
