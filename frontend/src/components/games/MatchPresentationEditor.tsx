import { useState } from 'react'
import { fetchJSON } from '../../lib/api'
import {
  MATCH_STATUSES,
  validatePresentation,
  type Presentation
} from '../../../../packages/match-presentation'
export function MatchPresentationEditor({
  game,
  onSaved
}: {
  game: { id: string; seasonId?: string; dataSource?: string; presentation?: Presentation }
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Presentation>(game.presentation || {})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  async function save(value: Presentation | null) {
    setSaving(true)
    setMessage('')
    try {
      const valid = validatePresentation(value)
      const result = await fetchJSON<{ revalidated: boolean }>(
        `/api/admin/matches/${game.dataSource === 'kalk' ? 'kalk' : 'game'}/${encodeURIComponent(game.seasonId || '')}/${encodeURIComponent(game.id)}/presentation`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ presentation: valid })
        }
      )
      setMessage(
        result.revalidated
          ? 'Zapisano.'
          : 'Zapisano. Odświeżenie WWW nie powiodło się; cache wygaśnie po 60 s.'
      )
      setDraft(valid || {})
      onSaved()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }
  if (game.dataSource === 'league') return null
  if (!game.seasonId) return <p>Mecz nie ma sezonu. Przypisz sezon przed edycją prezentacji WWW.</p>
  return (
    <details className="p-4 border border-bkpk-border rounded-xl">
      <summary className="cursor-pointer">Prezentacja meczu na WWW</summary>
      <form
        className="grid gap-3 mt-4"
        onSubmit={(event) => {
          event.preventDefault()
          void save(draft)
        }}
      >
        <label>
          Status{' '}
          <select
            value={draft.status || ''}
            onChange={(event) =>
              setDraft({
                ...draft,
                status: (event.target.value as Presentation['status']) || undefined
              })
            }
          >
            <option value="">Dane źródłowe</option>
            {MATCH_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        {(['competition', 'round', 'venue', 'kit', 'quarter', 'statusMessage'] as const).map(
          (key) => (
            <label key={key}>
              {
                {
                  competition: 'Rozgrywki',
                  round: 'Kolejka',
                  venue: 'Hala',
                  kit: 'Strój',
                  quarter: 'Kwarta',
                  statusMessage: 'Komunikat'
                }[key]
              }{' '}
              <input
                maxLength={500}
                value={draft[key] || ''}
                onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
              />
            </label>
          )
        )}
        {(['scoreUs', 'scoreThem'] as const).map((key) => (
          <label key={key}>
            {key === 'scoreUs' ? 'Punkty BeKaPaKa' : 'Punkty rywala'}{' '}
            <input
              type="number"
              min={0}
              max={999}
              value={draft[key] ?? ''}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  [key]: event.target.value === '' ? null : Number(event.target.value)
                })
              }
            />
          </label>
        ))}
        {(['previousDate', 'newDate'] as const).map((key) => (
          <label key={key}>
            {key === 'newDate' ? 'Nowy termin (ISO z godziną i strefą)' : 'Poprzedni termin (ISO)'}{' '}
            <input
              placeholder="RRRR-MM-DDTGG:MM:SS+02:00"
              value={draft[key] || ''}
              onChange={(event) => setDraft({ ...draft, [key]: event.target.value || null })}
            />
          </label>
        ))}
        <button disabled={saving} type="submit">
          Zapisz prezentację
        </button>
        <button disabled={saving} type="button" onClick={() => void save(null)}>
          Przywróć dane źródłowe
        </button>
        <p role="status">{message}</p>
      </form>
    </details>
  )
}
