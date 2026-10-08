import { NextResponse } from 'next/server'
import { backendPath } from '../../../../../lib/data/client'
import { mapBackendPlayByPlay } from '../../../../../lib/data/play-by-play'

export const dynamic = 'force-dynamic'

/** Akcja po akcji z bazy (KALK v2, synchronizowane skraperem) — bez pobierania stron KALK na żywo. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cleanId = id.replace(/^kalk-/, '')
  if (!/^\d+$/.test(cleanId)) {
    return NextResponse.json({ error: 'Nieprawidłowy identyfikator meczu' }, { status: 400 })
  }

  try {
    const res = await fetch(backendPath(`/api/games/${cleanId}/play-by-play`), { next: { revalidate: 300 } })
    if (res.status === 404) {
      return NextResponse.json({ error: 'Nie znaleziono meczu' }, { status: 404 })
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'Akcja po akcji chwilowo niedostępna' }, { status: 502 })
    }
    const data = mapBackendPlayByPlay(await res.json())
    if (!data) {
      return NextResponse.json({ error: 'Brak zapisu akcja po akcji dla tego meczu' }, { status: 404 })
    }
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' }
    })
  } catch {
    return NextResponse.json({ error: 'Akcja po akcji chwilowo niedostępna' }, { status: 502 })
  }
}
