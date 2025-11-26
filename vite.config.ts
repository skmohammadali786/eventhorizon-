import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // load env vars from .env, .env.production etc.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // make built asset paths relative so index.html can find JS/CSS on any host
    base: './',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    // expose only a VITE_ prefixed client var. Keep other secrets off client.
    define: {
      // if you still rely on process.env in some libs, map it to an object,
      // but prefer import.meta.env in your app code.
      'process.env': {},
      // optional: make the VITE var available at build time as a literal
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY ?? ''),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    // ensure build outputs to dist by default; keep defaults otherwise
    build: {
      outDir: 'dist',
    },
  };
});
