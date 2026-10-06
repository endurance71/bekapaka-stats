import { PageSkeleton } from '../../../components/public/shared/PageSkeleton'

export default function Loading() {
  return (
    <div className="container" style={{ paddingBlock: 'var(--space-6)', minHeight: 'calc(100dvh - var(--header-h))' }}>
      <p role="status">Pobieranie danych meczu…</p>
      <PageSkeleton variant="listing" />
    </div>
  )
}
