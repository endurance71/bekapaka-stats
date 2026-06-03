import { PageSkeleton } from '../components/public/shared/PageSkeleton'

export default function Loading() {
  return (
    <div className='container' style={{ paddingBlock: 'var(--space-6)' }}>
      <PageSkeleton variant='listing' />
    </div>
  )
}
