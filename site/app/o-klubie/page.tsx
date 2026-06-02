import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSiteMetadataBase } from '../../lib/data'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Klub | Przekierowanie',
  description: 'Sekcja klubowa zostala przeniesiona na /klub.'
}

export default function AboutPage() {
  redirect('/klub')
}
