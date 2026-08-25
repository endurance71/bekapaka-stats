import type { Metadata, Viewport } from 'next'
import { Montserrat, Bebas_Neue } from 'next/font/google'
import './globals.css'
import { PublicShell } from '../components/public/layout/PublicShell'
import { PreviewBanner } from '../components/public/layout/PreviewBanner'
import { getSiteMetadataBase } from '../lib/data'

const montserrat = Montserrat({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap'
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-bebas-neue',
  weight: ['400'],
  display: 'swap'
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0B0C',
  colorScheme: 'dark'
}

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'BeKaPaKa Bobolice',
  description: 'Oficjalna strona BeKaPaKa Bobolice: aktualności, terminarz, tabela, skład oraz sponsorzy.',
  alternates: {
    canonical: '/'
  },
  keywords: ['BeKaPaKa', 'Bobolice', 'koszykówka', 'klub sportowy', 'terminarz', 'tabela', 'skład', 'sponsorzy'],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/logo.png', type: 'image/png', sizes: '512x512' }
    ],
    apple: '/apple-touch-icon.png'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BeKaPaKa'
  },
  other: {
    'mobile-web-app-capable': 'yes'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='pl' className={`${montserrat.variable} ${bebasNeue.variable}`}>
      <body className='site-body'>
        <PreviewBanner />
        <PublicShell logoUrl='/logo.png'>{children}</PublicShell>
      </body>
    </html>
  )
}
