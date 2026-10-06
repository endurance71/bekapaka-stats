import { validatePresentation } from '../packages/match-presentation/index.js'
export async function updateMatchPresentation(db, { source, seasonId, id, presentation }) {
  if (!['game', 'kalk'].includes(source) || typeof seasonId !== 'string' || !seasonId || !id)
    throw new Error('Wymagane źródło, sezon i mecz')
  const validated = validatePresentation(presentation)
  const model = source === 'kalk' ? db.kalkMatch : db.game
  const where = source === 'kalk' ? { seasonId_id: { seasonId, id } } : { id }
  const existing = await model.findUnique({ where })
  if (!existing || existing.seasonId !== seasonId) return null
  return model.update({
    where,
    data: {
      presentation: validated === null ? db.jsonNull : validated,
      presentationUpdatedAt: new Date()
    }
  })
}
export async function invalidateMatchPages() {
  if (!process.env.SITE_REVALIDATE_SECRET || !process.env.SITE_BASE_URL) return false
  const response = await fetch(new URL('/api/revalidate', process.env.SITE_BASE_URL), {
    method: 'POST',
    headers: {
      'x-revalidate-secret': process.env.SITE_REVALIDATE_SECRET,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ source: 'backend' }),
    signal: AbortSignal.timeout(5000)
  })
  if (!response.ok) throw new Error(`Rewalidacja: ${response.status}`)
  return true
}
