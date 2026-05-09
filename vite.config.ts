import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Production build is served at https://<user>.github.io/wheel-of-fortune/.
// The dev server stays at the root path.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/wheel-of-fortune/' : '/',
  plugins: [react(), tailwindcss()],
}));
