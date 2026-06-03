type PageSkeletonProps = {
  variant?: 'listing' | 'grid' | 'table'
}

export function PageSkeleton({ variant = 'listing' }: PageSkeletonProps) {
  if (variant === 'grid') {
    return (
      <div className='page-skeleton page-skeleton--grid' aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className='page-skeleton__card skeleton-shimmer' />
        ))}
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className='page-skeleton page-skeleton--table' aria-hidden>
        <div className='page-skeleton__row skeleton-shimmer' />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className='page-skeleton__row skeleton-shimmer' />
        ))}
      </div>
    )
  }

  return (
    <div className='page-skeleton page-skeleton--listing' aria-hidden>
      <div className='page-skeleton__hero skeleton-shimmer' />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className='page-skeleton__line skeleton-shimmer' />
      ))}
    </div>
  )
}
