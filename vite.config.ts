import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Stringify the API key so it is inserted as a string literal in the build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  server: {
    hmr: false,
  },
});