import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(here, '../..');

function normalizeBase(value: string | undefined) {
  if (!value || value === '/') return '/';
  const withLeading = value.startsWith('/') ? value : `/${value}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

export default defineConfig({
  base: normalizeBase(process.env.OXS_UI_STUDIO_BASE),
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@ontologyx/ui-docs', replacement: path.resolve(workspaceRoot, 'packages/ui/src') },
    ],
  },
  server: {
    port: 5174,
    strictPort: true,
    fs: { allow: [workspaceRoot] },
  },
  preview: {
    port: 4174,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
});
