import Link from 'next/link'

export function NewsPagination({ page, hasNext, category = '' }: { category?: string; page: number; hasNext: boolean }) {
  const href = (target: number) => `/aktualnosci?${new URLSearchParams({ ...(target > 1 ? { page: String(target) } : {}), ...(category ? { category } : {}) })}`
  if (page <= 1 && !hasNext) return null

  return (
    <nav className='pagination' aria-label='Strony aktualności'>
      {page > 1 ? <Link href={href(page-1)}>← Nowsze</Link> : <span />}
      <span aria-current='page'>Strona {page}</span>
      {hasNext ? <Link href={href(page+1)}>Starsze →</Link> : <span>To wszystkie aktualności</span>}
    </nav>
  )
}
