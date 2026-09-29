import Link from 'next/link'

export function NewsPagination({ page, hasNext }: { page: number; hasNext: boolean }) {
  if (page <= 1 && !hasNext) return null

  return (
    <nav className='news-pagination' aria-label='Strony aktualności'>
      {page > 1 ? <Link href={page === 2 ? '/aktualnosci' : `/aktualnosci?page=${page - 1}`}>← Nowsze</Link> : <span />}
      <span aria-current='page'>Strona {page}</span>
      {hasNext ? <Link href={`/aktualnosci?page=${page + 1}`}>Starsze →</Link> : <span>To wszystkie aktualności</span>}
    </nav>
  )
}
