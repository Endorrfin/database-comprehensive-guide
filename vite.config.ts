import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base:'./' keeps the build sub-path-safe under any GitHub Pages URL
// (https://endorrfin.github.io/database-comprehensive-guide/). Hash routing
// + relative base = zero-config deploy. See CLAUDE.md §2, §11.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});
