import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Manifest + PWA icons only — avoids ETIMEDOUT when public/photos are iCloud placeholders. */
const copyEssentialPublicPlugin = () => ({
  name: 'copy-essential-public',
  closeBundle() {
    const root = resolve(__dirname, 'public');
    const out = resolve(__dirname, 'dist');
    mkdirSync(out, { recursive: true });
    for (const file of ['manifest.webmanifest', 'favicon.ico', 'favicon.png', 'apple-touch-icon.png', 'icon-96.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'] as const) {
      const src = resolve(root, file);
      if (existsSync(src)) {
        cpSync(src, resolve(out, file));
      }
    }
  },
});

/**
 * Service worker z numerem builda: `__BUILD_ID__` w dist/sw.js → znacznik czasu builda.
 * Bez tego plik sw.js był identyczny po każdym wdrożeniu i panel nigdy nie widział nowej wersji.
 */
const serviceWorkerVersionPlugin = () => ({
  name: 'service-worker-version',
  closeBundle() {
    const out = resolve(__dirname, 'dist', 'sw.js');
    if (!existsSync(out)) cpSync(resolve(__dirname, 'public', 'sw.js'), out);
    const buildId = Date.now().toString(36);
    const assetsDir = resolve(__dirname, 'dist', 'assets');
    // Lista plików wersji do precache w SW (bez map źródeł)
    const assets = existsSync(assetsDir)
      ? readdirSync(assetsDir).filter((f) => !f.endsWith('.map')).sort().map((f) => `/assets/${f}`)
      : [];
    writeFileSync(
      out,
      readFileSync(out, 'utf8')
        .replaceAll('__BUILD_ID__', buildId)
        .replace('/*__PRECACHE_ASSETS__*/[]', JSON.stringify(assets)),
    );
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
    plugins: [react(), ...(copyFullPublic ? [] : [copyEssentialPublicPlugin()]), serviceWorkerVersionPlugin()],
    build: {
      target: 'es2020',
      copyPublicDir: copyFullPublic,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          // Bez osobnych grup recharts/markdown: strony z wykresami i blok AI są ładowane leniwie,
          // więc bundler trzyma je poza wejściem (ręczna grupa wciągała ~420 kB wykresów na start).
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('recharts') || /[\\/](d3-|victory-vendor|react-smooth|decimal\.js-light|react-markdown|remark|mdast|micromark|unified|hast|unist|vfile)/.test(id)) return;
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react-router')) return 'react-router';
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
