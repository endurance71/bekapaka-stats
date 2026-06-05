import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Logo + manifest only — avoids ETIMEDOUT when public/photos are iCloud placeholders. */
const copyEssentialPublicPlugin = () => ({
  name: 'copy-essential-public',
  closeBundle() {
    const root = resolve(__dirname, 'public');
    const out = resolve(__dirname, 'dist');
    mkdirSync(out, { recursive: true });
    for (const file of ['logo.png', 'manifest.webmanifest'] as const) {
      const src = resolve(root, file);
      if (existsSync(src)) {
        cpSync(src, resolve(out, file));
      }
    }
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const copyFullPublic = process.env.VITE_COPY_FULL_PUBLIC === '1';

  const safariOverlayCandidates = [
    process.env.SAFARI_OVERLAY_PATH,
    resolve(__dirname, '../packages/safari-overlay'),
    '/packages/safari-overlay',
  ].filter(Boolean) as string[];
  const safariOverlay =
    safariOverlayCandidates.find((path) => existsSync(path)) ??
    safariOverlayCandidates[0]!;

  return {
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@bekapaka/safari-overlay': safariOverlay,
      },
    },
    plugins: [react(), ...(copyFullPublic ? [] : [copyEssentialPublicPlugin()])],
    build: {
      target: 'es2020',
      copyPublicDir: copyFullPublic,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react-router')) return 'react-router';
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('mdast')) {
              return 'markdown';
            }
            return 'vendor';
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      css: true,
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:4000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false,
        },
      },
    },
  };
});
