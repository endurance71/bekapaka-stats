import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
