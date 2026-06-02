import Link from 'next/link'

export default function NotFound() {
  return (
    <section className='section-card'>
      <h1>Nie znaleziono strony</h1>
      <p>Ta podstrona nie istnieje lub zostala przeniesiona.</p>
      <Link className='button button--primary' href='/'>
        Wroc na strone glowna
      </Link>
    </section>
  )
}
