import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="status-page" data-theme="plyta">
      <div className="container status-page__inner status-page__inner--404">
        <span className="status-page__code cut outline" aria-hidden="true">
          404
        </span>
        <div className="status-page__text">
          <p className="kicker">Błąd 404</p>
          <h1 className="status-page__title">Piłka poza boiskiem</h1>
          <p className="status-page__lead">Ta podstrona nie istnieje albo została przeniesiona.</p>
          <div className="cluster">
            <Link className="btn btn--primary" href="/">
              Strona główna
            </Link>
            <Link className="btn btn--secondary" href="/mecze">
              Mecze i wyniki
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
