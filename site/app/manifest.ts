import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BeKaPaKa Bobolice',
    short_name: 'BeKaPaKa',
    description: 'Oficjalna strona BeKaPaKa Bobolice',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0B0C',
    theme_color: '#0B0B0C',
    lang: 'pl-PL'
  }
}
