import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
})
