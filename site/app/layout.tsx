import type { Metadata } from 'next'
import './globals.css'
import { PublicShell } from '../components/public/layout/PublicShell'
import { getSiteMetadataBase } from '../lib/data'

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
    <html lang='pl'>
      <body><PublicShell>{children}</PublicShell></body>
    </html>
  )
}
