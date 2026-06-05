/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  /* Monorepo: webpack build resolves ../packages; Turbopack dev needs repo root */
  transpilePackages: [
    'react-markdown',
    'micromark',
    'micromark-core-commonmark',
    'micromark-util-character'
  ]
}

export default nextConfig
