import Link from 'next/link'
export default function NotFound() {
 return <section className="section" data-theme="plyta"><div className="container not-found">
   <span className="not-found__code" aria-hidden="true">404</span>
   <div className="not-found__text"><p className="label accent">Błąd 404</p><h1>Piłka poza boiskiem</h1><p>Ta podstrona nie istnieje lub została przeniesiona.</p>
   <div className="cluster"><Link className="btn btn--primary" href="/">Strona główna</Link><Link className="btn btn--secondary" href="/mecze">Mecze i wyniki</Link></div></div>
 </div></section>
}
