/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  /* react-markdown / micromark — importy z dev/ muszą się poprawnie rozwiązywać w Webpack */
  transpilePackages: [
    'react-markdown',
    'micromark',
    'micromark-core-commonmark',
    'micromark-util-character'
  ]
}

export default nextConfig
