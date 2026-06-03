import { NextResponse } from 'next/server'
import { getGameByIdState } from '../../../../lib/data/backend'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const state = await getGameByIdState(params.id)
  if (!state.data) {
    return NextResponse.json({ error: state.message || 'Mecz nie znaleziony' }, { status: 404 })
  }
  return NextResponse.json(state.data)
}
