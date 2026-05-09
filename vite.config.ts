import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Served from https://<user>.github.io/wheel-of-fortune/ on Pages.
  base: process.env.GITHUB_ACTIONS ? '/wheel-of-fortune/' : '/',
  plugins: [react(), tailwindcss()],
});
