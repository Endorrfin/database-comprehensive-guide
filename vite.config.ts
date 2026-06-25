import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base:'./' keeps the build sub-path-safe under any GitHub Pages URL
// (https://endorrfin.github.io/database-comprehensive-guide/). Hash routing
// + relative base = zero-config deploy. See CLAUDE.md §2, §11.
//
// CHANGED (S12): manualChunks separates react + react-dom into a stable
// react-vendor chunk (long-lived cache; never changes between content sessions).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // CHANGED (S12): Separate react + react-dom into a stable cached chunk.
        // Function form used (object form not accepted by this Rollup type version).
        manualChunks(id: string) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
        },
      },
    },
  },
});
