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

export default async function EventDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  redirect(`/mecze/${slug}`)
}
