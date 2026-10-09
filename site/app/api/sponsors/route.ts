import { NextResponse } from 'next/server'
import { getSponsorsState } from '../../../lib/data/sponsors'

// Public sponsor list in the order of bekapaka.pl/sponsorzy — read by Studio for the sponsor footer of Facebook posts.
export const revalidate = 300

export async function GET() {
  const state = await getSponsorsState(60)
  const sponsors = [...state.data]
    .sort((a, b) => (a.order || 999) - (b.order || 999))
    .map(({ name, order, websiteUrl, facebookUrl }) => ({ name, order, websiteUrl, facebookUrl: facebookUrl || '' }))
  return NextResponse.json({ sponsors }, { headers: { 'Cache-Control': 'public, max-age=300' } })
}
