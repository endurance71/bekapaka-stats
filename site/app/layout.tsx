import type { Metadata, Viewport } from 'next'
import { Montserrat, Bebas_Neue } from 'next/font/google'
import './globals.css'
import { PublicShell } from '../components/public/layout/PublicShell'
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
  themeColor: '#0B0B0C'
}

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'BeKaPaKa Bobolice',
  description: 'Oficjalna strona BeKaPaKa Bobolice: aktualnosci, wydarzenia, sponsorzy, sklad i dokumenty.',
  alternates: {
    canonical: '/'
  },
  keywords: ['BeKaPaKa', 'Bobolice', 'koszykowka', 'klub sportowy', 'wydarzenia', 'sponsorzy']
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='pl' className={`${montserrat.variable} ${bebasNeue.variable}`}>
      <body><PublicShell logoUrl="/logo.png">{children}</PublicShell></body>
    </html>
  )
}
