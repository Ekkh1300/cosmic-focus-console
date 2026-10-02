import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { defineConfig } from 'vite'

/**
 * Build the whole app into one self-contained `dist/index.html`.
 *
 * Everything (JS, CSS, fonts) is inlined as text inside the document, so the
 * file opens straight from `file://` with no server and no network — including
 * the dynamic import of the planet, which the plugin forces into one bundle.
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    // separate output folder so `npm run build` (multi-file) never clobbers it
    outDir: 'dist-single',
    emptyOutDir: true,
    target: 'es2022',
    cssCodeSplit: false,
    assetsInlineLimit: 100 * 1024 * 1024,
    chunkSizeWarningLimit: 4096,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
