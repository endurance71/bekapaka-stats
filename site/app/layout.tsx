import { isLocalMediaPreview } from '../lib/data/media-review'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { SiteFooter } from '../components/public/layout/SiteFooter'
import { PublicShell } from '../components/public/layout/PublicShell'
import { getSiteMetadataBase } from '../lib/data'

const barlow = localFont({
  src: [
    { path: './fonts/Barlow-Regular.woff2', weight: '400' },
    { path: './fonts/Barlow-SemiBold.woff2', weight: '600' }
  ],
  variable: '--font-barlow',
  display: 'swap'
})
const display = localFont({
  src: './fonts/BarlowCondensed-ExtraBold.woff2',
  weight: '800',
  variable: '--font-barlow-condensed',
  display: 'swap'
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0B0B',
  colorScheme: 'dark'
}

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'BeKaPaKa Bobolice',
  description:
    'Oficjalna strona BeKaPaKa Bobolice: aktualności, terminarz, tabela, skład oraz sponsorzy.',
  alternates: {
    canonical: '/'
  },
  keywords: [
    'BeKaPaKa',
    'Bobolice',
    'koszykówka',
    'klub sportowy',
    'terminarz',
    'tabela',
    'skład',
    'sponsorzy'
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: '/favicon-180.png'
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
    <html lang="pl" className={`${barlow.variable} ${display.variable}`}>
      <body className="site-body">
        <PublicShell footer={<SiteFooter />}>
          {isLocalMediaPreview() && (
            <div className="local-preview-notice sr-only" role="status">
              Podgląd lokalny ze zdjęciami. Metadane i zgody wymagają weryfikacji przed publikacją.
            </div>
          )}
          {children}
        </PublicShell>
      </body>
    </html>
  )
}
