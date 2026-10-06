import Link from 'next/link'
import type { Metadata } from 'next'
import { siteSettings } from '../../lib/site-settings'
import { Section } from '../../components/public/shared/Section'
import { FsmmSupportSection } from '../../components/public/support/FsmmSupportSection'
import { getSiteMetadataBase } from '../../lib/data'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  alternates: { canonical: '/klub' },
  title: 'O klubie | BeKaPaKa Bobolice',
  description: 'Poznaj BeKaPaKa Bobolice: drużynę KALK, stowarzyszenie i organizowane w Bobolicach turnieje. Kontakt, dokumenty i wsparcie klubu.'
}

export default function ClubPage() {
  return (
    <div className="club-page">
      <Section>
        <div className="club-hero">
          <div className="club-hero__copy">
            <span className="label accent">BeKaPaKa Bobolice</span>
            <h1>O klubie</h1>
            <p className="club-hero__lead">Jesteśmy drużyną koszykówki z Bobolic. Gramy w KALK, organizujemy turnieje i łączymy ludzi wokół sportu.</p>
            <p className="muted">Za BeKaPaKa stoją zawodnicy, kibice i lokalni partnerzy. Na parkiecie reprezentujemy nasze miasto, poza nim tworzymy przestrzeń do wspólnego działania.</p>
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
            <p>Sportowa rywalizacja to jedna część naszej działalności. Równie ważne są aktywność, integracja mieszkańców i lokalne wydarzenia, podczas których można grać i kibicować razem.</p>
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
      <Section>
        <div className="club-values">
          <div className="club-page__copy"><span className="label accent">Nasze wartości</span><h2>Na parkiecie i poza nim</h2><p className="muted">Chcemy rozwijać koszykówkę w Bobolicach przez regularną grę, wspólne działania i sportową rywalizację.</p></div>
          <dl className="club-values__list">
            <div><dt>Pasja i zaangażowanie</dt><dd>Każdy trening i mecz to okazja do rozwoju.</dd></div>
            <div><dt>Wspólnota</dt><dd>Łączymy bobolickich koszykarzy i kibiców.</dd></div>
            <div><dt>Aktywność i fair play</dt><dd>Zachęcamy do ruchu i uczciwej rywalizacji.</dd></div>
            <div><dt>Nasze miasto</dt><dd>Reprezentujemy Bobolice na regionalnych parkietach.</dd></div>
          </dl>
        </div>
      </Section>
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
