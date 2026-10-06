import Link from 'next/link'
import { JerseyShowcase } from '../../components/public/home/JerseyShowcase'
import type { Metadata } from 'next'
import { siteSettings } from '../../lib/site-settings'
import { Section } from '../../components/public/shared/Section'
import { FsmmSupportSection } from '../../components/public/support/FsmmSupportSection'
import { getNewsPosts, getSiteMetadataBase } from '../../lib/data'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  alternates: { canonical: '/klub' },
  title: 'O klubie | BeKaPaKa Bobolice',
  description: 'Poznaj BeKaPaKa Bobolice: drużynę KALK, stowarzyszenie i organizowane w Bobolicach turnieje. Kontakt, dokumenty i wsparcie klubu.'
}

export default async function ClubPage() {
  const reports = (await getNewsPosts(100)).filter(item => ['3-turniej-koszykowki-o-puchar-burmistrza-bobolic-26-wrzesnia-2026', 'ii-turniej-koszykowki-spolecznika-subregionu-d-parafiada-2026'].includes(item.slug)).slice(0, 2)
  return (
    <div className="club-page">
      <Section>
        <div className="club-hero">
          <div className="club-hero__copy">
            <span className="label accent">BeKaPaKa Bobolice</span>
            <h1>O klubie</h1>
            <p className="club-hero__lead">Jesteśmy drużyną koszykówki z Bobolic. Gramy w KALK, organizujemy turnieje i łączymy ludzi wokół sportu.</p>
            <p className="muted">Za BeKaPaKa stoją zawodnicy, kibice i lokalni partnerzy. Wyniki spotkań publikujemy w terminarzu, a relacje z wydarzeń w aktualnościach.</p>
            <div className="club-page__actions">
              <Link className="btn btn--primary" href="/sklad">Poznaj drużynę</Link>
              <a className="btn btn--text" href="#dzialalnosc">Działalność ↓</a>
              <a className="btn btn--text" href="#wsparcie">Wsparcie 1,5% ↓</a>
              <a className="btn btn--text" href="#kontakt">Kontakt ↓</a>
            </div>
          </div>
          <div className="club-hero__identity" aria-label="Identyfikacja BeKaPaKa Bobolice">
            <img className="club-hero__crest" src="/brand/herb2-kolor.svg" width={300} height={289} alt="BeKaPaKa Bobolice — Znak główny 2.0" />
            <img className="club-hero__wordmark" src="/brand/wordmark-negatyw.svg" width={300} height={60} alt="BeKaPaKa Bobolice" />
          </div>
        </div>
      </Section>
      <Section tone="paper" id="dzialalnosc">
        <div className="club-intro">
          <div className="club-page__copy">
            <span className="label accent">Kim jesteśmy</span>
            <h2>Koszykówka z Bobolic</h2>
            <p><strong>{siteSettings.organizationName}</strong> to stowarzyszenie pasjonatów i amatorów koszykówki z Bobolic oraz okolicznych miejscowości. Nasza drużyna reprezentuje miasto i gminę w Koszalińskiej Amatorskiej Lidze Koszykówki.</p>

          </div>
          <aside className="club-facts" aria-labelledby="club-facts-heading">
            <h3 id="club-facts-heading">Klub w skrócie</h3>
            <dl>
              <div><dt>Nasze miasto</dt><dd>Bobolice</dd></div>
              <div><dt>Rozgrywki ligowe</dt><dd>KALK (Dywizja II)</dd></div>
              <div><dt>Mecze ligowe</dt><dd>KOSiR Koszalin</dd></div>
              <div><dt>Turniej o Puchar Burmistrza</dt><dd>Hala CESiR, Bobolice</dd></div>
            </dl>
            <Link className="btn btn--text" href="/dokumenty">Dokumenty stowarzyszenia →</Link>
          </aside>
        </div>
        <div className="club-activities">
          <div className="stripes" aria-hidden="true"><i /></div>
          <div className="club-activities__head"><span className="label accent">Nasza działalność</span><h2>Drużyna, społeczność, wydarzenia</h2></div>
          <article className="club-activity">
            <span className="club-activity__number" aria-hidden="true">01</span>
            <div><span className="label accent">Drużyna</span><h3>Gramy w KALK</h3></div>
            <div className="club-page__copy"><p>Trenujemy i rywalizujemy w Koszalińskiej Amatorskiej Lidze Koszykówki. Terminarz, wyniki i statystyki naszych zawodników znajdziesz na stronie.</p><Link className="btn btn--text" href="/mecze">Mecze i wyniki →</Link></div>
          </article>
          <article className="club-activity">
            <span className="club-activity__number" aria-hidden="true">02</span>
            <div><span className="label accent">Społeczność</span><h3>Łączy nas koszykówka</h3></div>
            <div className="club-page__copy"><p>Łączymy zawodników, kibiców i mieszkańców Bobolic. Lokalni partnerzy i gmina wspierają nasze działania — dzięki nim możemy rozwijać klub i organizować wydarzenia.</p><Link className="btn btn--text" href="/sponsorzy">Partnerzy klubu →</Link></div>
          </article>
          <article className="club-activity">
            <span className="club-activity__number" aria-hidden="true">03</span>
            <div><span className="label accent">Wydarzenia</span><h3>Turnieje w Bobolicach</h3></div>
            <div className="club-page__copy"><p>Organizujemy Turniej Koszykówki o Puchar Burmistrza Bobolic. Angażujemy się również w Turniej Koszykówki Społecznika, w tym Parafiadę o Puchar Proboszcza, realizowaną dzięki Programowi „Społecznik”.</p><Link className="btn btn--text" href="/aktualnosci">Relacje z wydarzeń →</Link></div>
          </article>
        </div>
      </Section>
      <Section tone="paper" id="relacje">
        <span className="label accent">Z życia klubu</span><h2>Relacje z wydarzeń</h2>
        {reports.length ? <ul className="club-reports">{reports.map(item => <li key={item.id}><Link href={`/aktualnosci/${item.slug}`}>{item.title}</Link><p>{item.excerpt}</p></li>)}</ul> : <p>Relacje pojawią się po publikacji przez redakcję.</p>}
      </Section>
      <Section tag="Barwy klubu" title="Stroje meczowe" titleId="h-stroje"><JerseyShowcase /></Section>
      <Section tone="paper" id="wsparcie">
        <FsmmSupportSection variant="page" />
        <section className="club-contact" id="kontakt" aria-labelledby="club-contact-heading">
          <div className="club-page__copy"><span className="label accent">Porozmawiajmy</span><h2 id="club-contact-heading">Kontakt z klubem</h2><p>Chcesz wesprzeć drużynę, zapytać o naszą działalność lub nawiązać współpracę? Napisz do nas.</p></div>
          <div className="club-contact__details">
            <span className="label muted">E-mail</span>
            <a className="club-contact__email" href={`mailto:${siteSettings.contactEmail}`}>{siteSettings.contactEmail}</a>
            <p className="muted">{siteSettings.organizationName}</p>
            <Link className="btn btn--text" href="/dokumenty">Dokumenty klubu →</Link>
          </div>
        </section>
      </Section>
    </div>
  )
}
