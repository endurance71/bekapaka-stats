import type { DataStateSource, DataStateStatus } from '../../../lib/data'

export function DataStateNotice({
  status,
  source,
  message
}: {
  status: DataStateStatus
  source: DataStateSource
  message?: string
}) {
  if (status === 'ok' && source === 'live') return null

  if (status === 'error') {
    return (
      <div className='data-state-notice data-state-notice--error' role='status' aria-live='polite'>
        <strong>Uwaga:</strong> widzisz dane zastępcze, bo źródło danych jest chwilowo niedostępne.
        {message ? <span> {message}</span> : null}
      </div>
    )
  }

  if (source === 'fallback') {
    return (
      <div className='data-state-notice data-state-notice--fallback' role='status' aria-live='polite'>
        <strong>Informacja:</strong> wyświetlamy dane zastępcze — źródło live jest chwilowo niedostępne.
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <div className='data-state-notice data-state-notice--empty' role='status' aria-live='polite'>
        Brak danych do wyświetlenia w tej sekcji.
      </div>
    )
  }

  return null
}
