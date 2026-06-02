import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSiteMetadataBase } from '../../../lib/data'

type Params = { slug: string }

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...getSiteMetadataBase(),
    title: 'Wydarzenia | Przekierowanie',
    description: 'Wydarzenia zostaly przeniesione do sekcji Mecze.'
  }
}

export default function EventDetailPage({ params }: { params: Params }) {
  redirect(`/mecze/${params.slug}`)
}
