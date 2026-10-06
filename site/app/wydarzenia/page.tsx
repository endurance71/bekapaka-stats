import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSiteMetadataBase } from '../../lib/data'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  alternates: { canonical: '/wydarzenia' },
  title: 'Wydarzenia | Przekierowanie',
  description: 'Wydarzenia zostaly przeniesione do sekcji Mecze.'
}

export default function EventsPage() {
  redirect('/mecze')
}
