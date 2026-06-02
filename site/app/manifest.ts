import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BeKaPaKa Bobolice',
    short_name: 'BeKaPaKa',
    description: 'Oficjalna strona BeKaPaKa Bobolice',
    start_url: '/',
    display: 'standalone',
    background_color: '#101010',
    theme_color: '#ECA72C',
    lang: 'pl-PL'
  }
}
