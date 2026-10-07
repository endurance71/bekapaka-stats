/** Szkielet ładowania w kształcie docelowego układu: nagłówek strony + wiersze / siatka / tabela. */
export function PageSkeleton({ variant = 'listing', label = 'Ładowanie…' }: { variant?: 'listing' | 'grid' | 'table'; label?: string }) {
  return (
    <div className="page-skeleton" data-theme="plyta">
      <p className="sr-only" role="status">
        {label}
      </p>
      <div className="container page-skeleton__header" aria-hidden="true">
        <span className="skeleton page-skeleton__kicker" />
        <span className="skeleton page-skeleton__title" />
      </div>
      <div className={`container page-skeleton__body page-skeleton__body--${variant}`} aria-hidden="true">
        {Array.from({ length: variant === 'grid' ? 8 : variant === 'table' ? 10 : 5 }).map((_, index) => (
          <span key={index} className="skeleton page-skeleton__item" />
        ))}
      </div>
    </div>
  )
}
