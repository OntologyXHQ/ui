import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const external = (id: string) =>
  id === 'react' || id === 'react-dom' || id.startsWith('react/') || id.startsWith('react-dom/');

export default defineConfig({
  build: {
    target: 'es2022',
    copyPublicDir: false,
    cssCodeSplit: false,
    sourcemap: false,
    lib: {
      entry: {
        index: path.resolve(here, 'src/index.ts'),
        advanced: path.resolve(here, 'src/advanced.ts'),
        icons: path.resolve(here, 'src/icons.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external,
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
