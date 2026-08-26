import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BeKaPaKa Bobolice',
    short_name: 'BeKaPaKa',
    description: 'Oficjalna strona BeKaPaKa Bobolice',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0B0C',
    theme_color: '#ECA72C',
    orientation: 'portrait',
    lang: 'pl-PL',
    categories: ['sports', 'news'],
    icons: [
      {
        src: '/favicon.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    shortcuts: [
      {
        name: 'Terminarz i Wyniki',
        short_name: 'Mecze',
        url: '/mecze',
        icons: [{ src: '/favicon.png', sizes: '32x32' }]
      },
      {
        name: 'Kadra i Zawodnicy',
        short_name: 'Skład',
        url: '/sklad',
        icons: [{ src: '/favicon.png', sizes: '32x32' }]
      },
      {
        name: 'Aktualności Klubowe',
        short_name: 'Wpisy',
        url: '/aktualnosci',
        icons: [{ src: '/favicon.png', sizes: '32x32' }]
      }
    ]
  }
}
