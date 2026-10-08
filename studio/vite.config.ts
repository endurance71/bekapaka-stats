import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], resolve: { alias: { zod: fileURLToPath(new URL('./node_modules/zod', import.meta.url)) } }, server: { fs: { allow: ['..'] }, proxy: { '/api/studio': process.env.STUDIO_API_PROXY || 'http://127.0.0.1:4001' } }, build: { sourcemap: false } });
