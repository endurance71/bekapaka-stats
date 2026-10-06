import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { formats: ['image/avif', 'image/webp'], deviceSizes: [480, 768, 1024, 1280, 1600, 1920, 2400], remotePatterns: [{ protocol: 'https', hostname: 'cms.bekapaka.pl' }, { protocol: 'https', hostname: 'www.kalk-koszalin.com' }, { protocol: 'http', hostname: 'localhost', port: '1337' }] },
  /* Monorepo: importy z ../packages/design-tokens */
  turbopack: {
    root: repoRoot
  },
  outputFileTracingRoot: repoRoot,
  transpilePackages: [
    'react-markdown',
    'micromark',
    'micromark-core-commonmark',
    'micromark-util-character'
  ]
}

export default nextConfig
