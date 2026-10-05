import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { scripturePreviewPlugin } from './dev/scripture-preview.js'
import { codexPreviewPlugin } from './dev/codex-preview.js'

export default defineConfig(({ command }) => ({
  plugins: [react(), scripturePreviewPlugin(), codexPreviewPlugin()],
  define: { 'import.meta.env.VITE_AI_PROVIDER': JSON.stringify(command === 'serve' ? 'codex' : 'cloudflare') },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://sermon-studio.pages.dev',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress warnings about undeclared globals (THEMES, KODY_VOICE, etc.)
        // These are set on window by config.js and prompts.js before app.jsx runs.
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'firebase/compat/app',
      'firebase/compat/firestore',
    ],
  },
}))
