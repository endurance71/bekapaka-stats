import { notFound } from 'next/navigation'
import { getRosterState } from '../../../lib/data'
import { PlayerProfile } from '../../../components/public/shared/PlayerProfile'
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = (await getRosterState()).data.find((item) => item.id === id)
  return {
    title: player ? `${player.firstName} ${player.lastName} | BeKaPaKa` : 'Zawodnik | BeKaPaKa',
    alternates: { canonical: `/sklad/${encodeURIComponent(id)}` }
  }
}
export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = (await getRosterState()).data.find((item) => item.id === id)
  if (!player) notFound()
  return <PlayerProfile player={player} standalone />
}
