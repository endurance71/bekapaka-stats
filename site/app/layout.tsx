import type { Metadata } from 'next'
import './globals.css'
import { SiteFooter, SiteHeader } from '../components/public-site'
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
      <body>
        <a href='#content' className='skip-link'>
          Przejdz do tresci
        </a>
        <SiteHeader />
        <main id='content' className='container'>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
