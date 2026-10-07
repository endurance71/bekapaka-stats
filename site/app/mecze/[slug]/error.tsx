'use client'
import Link from 'next/link'

export default function MatchError({ retry }: { retry: () => void }) {
  return (
    <section className="status-page" data-theme="plyta" role="alert">
      <div className="container status-page__inner">
        <p className="kicker">Mecz</p>
        <h1 className="status-page__title">Nie można pobrać meczu</h1>
        <p className="status-page__lead">Liga nie odpowiada albo połączenie zostało przerwane. Spróbuj ponownie za chwilę.</p>
        <div className="cluster">
          <button type="button" className="btn btn--primary" onClick={retry}>
            Spróbuj ponownie
          </button>
          <Link className="btn btn--secondary" href="/mecze">
            Wszystkie mecze
          </Link>
        </div>
      </div>
    </section>
  )
}
