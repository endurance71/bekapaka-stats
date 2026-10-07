import { useState } from 'react'
import { fetchJSON } from '../../lib/api'
import {
  MATCH_STATUSES,
  validatePresentation,
  type Presentation
} from '../../../../packages/match-presentation'

/** Pola formularza — Digital 2.0: płaskie pole, linia 1 px, fokus globalny */
const fieldLabel = 'grid gap-1.5 label-caps text-xs text-bkpk-text-secondary'
const fieldControl =
  'w-full min-h-[44px] px-3 bg-bkpk-bg border border-bkpk-border-strong text-bkpk-text-primary font-text normal-case tracking-normal font-normal placeholder:text-bkpk-text-muted hover:border-bkpk-text-secondary transition-colors'

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
  if (!game.seasonId) return <p className="text-sm text-bkpk-text-secondary border-l-2 border-bkpk-border-strong pl-3">Mecz nie ma sezonu. Przypisz sezon przed edycją prezentacji WWW.</p>
  return (
    <details className="group bg-bkpk-surface border border-bkpk-border-subtle">
      <summary className="cursor-pointer min-h-[44px] flex items-center px-4 label-caps text-xs text-bkpk-text-primary hover:bg-bkpk-surface-elevated transition-colors">Prezentacja meczu na WWW</summary>
      <form
        className="grid gap-4 sm:grid-cols-2 p-4 border-t border-bkpk-border-subtle"
        onSubmit={(event) => {
          event.preventDefault()
          void save(draft)
        }}
      >
        <label className={fieldLabel}>
          Status{' '}
          <select
            className={fieldControl}
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
            <label key={key} className={fieldLabel}>
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
                className={fieldControl}
                maxLength={500}
                value={draft[key] || ''}
                onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
              />
            </label>
          )
        )}
        {(['scoreUs', 'scoreThem'] as const).map((key) => (
          <label key={key} className={fieldLabel}>
            {key === 'scoreUs' ? 'Punkty BeKaPaKa' : 'Punkty rywala'}{' '}
            <input
              className={`${fieldControl} tabular-nums`}
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
          <label key={key} className={fieldLabel}>
            {key === 'newDate' ? 'Nowy termin (ISO z godziną i strefą)' : 'Poprzedni termin (ISO)'}{' '}
            <input
              className={`${fieldControl} tabular-nums`}
              placeholder="RRRR-MM-DDTGG:MM:SS+02:00"
              value={draft[key] || ''}
              onChange={(event) => setDraft({ ...draft, [key]: event.target.value || null })}
            />
          </label>
        ))}
        <button className="btn" disabled={saving} type="submit">
          Zapisz prezentację
        </button>
        <button className="btn btn-secondary" disabled={saving} type="button" onClick={() => void save(null)}>
          Przywróć dane źródłowe
        </button>
        <p role="status" className="sm:col-span-2 text-sm text-bkpk-text-secondary">{message}</p>
      </form>
    </details>
  )
}
