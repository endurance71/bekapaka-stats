import { JerseyShowcase } from '../../components/public/home/JerseyShowcase'
import type { Metadata } from 'next'
import { siteSettings } from '../../lib/site-settings'
import { Story } from '../../components/public/news/Story'
import { ArrowLink } from '../../components/public/primitives/ArrowLink'
import { Band } from '../../components/public/primitives/Band'
import { BandHead } from '../../components/public/primitives/BandHead'
import { JerseyStripes } from '../../components/public/primitives/JerseyStripes'
import { FsmmSupportSection } from '../../components/public/support/FsmmSupportSection'
import { getNewsPosts, getSiteMetadataBase } from '../../lib/data'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  alternates: { canonical: '/klub' },
  title: 'O klubie | BeKaPaKa Bobolice',
  description: 'Poznaj BeKaPaKa Bobolice: drużynę KALK, stowarzyszenie i organizowane w Bobolicach turnieje. Kontakt, dokumenty i wsparcie klubu.'
}

export default async function ClubPage() {
  const reports = (await getNewsPosts(100))
    .filter((item) => ['3-turniej-koszykowki-o-puchar-burmistrza-bobolic-26-wrzesnia-2026', 'ii-turniej-koszykowki-spolecznika-subregionu-d-parafiada-2026'].includes(item.slug))
    .slice(0, 2)
  const pillars = [
    { label: 'Drużyna', title: 'Gramy w KALK', text: 'Trenujemy i rywalizujemy w Koszalińskiej Amatorskiej Lidze Koszykówki. Terminarz, wyniki i statystyki zawodników są na stronie.', href: '/mecze', link: 'Mecze i wyniki' },
    { label: 'Społeczność', title: 'Łączy nas koszykówka', text: 'Łączymy zawodników, kibiców i mieszkańców Bobolic. Lokalni partnerzy i gmina wspierają nasze działania — dzięki nim możemy organizować wydarzenia.', href: '/sponsorzy', link: 'Partnerzy klubu' },
    { label: 'Wydarzenia', title: 'Turnieje w Bobolicach', text: 'Organizujemy Turniej Koszykówki o Puchar Burmistrza Bobolic. Angażujemy się w Turniej Koszykówki Społecznika, w tym Parafiadę o Puchar Proboszcza, realizowaną dzięki Programowi „Społecznik”.', href: '/aktualnosci?category=Turniej', link: 'Relacje z turniejów' }
  ]

  return (
    <div className="club-page">
      <section className="club-hero" data-theme="plyta" aria-labelledby="h-club">
        <div className="container club-hero__grid">
          <div className="club-hero__text">
            <p className="kicker">O klubie · BeKaPaKa Bobolice</p>
            <h1 id="h-club" className="club-hero__title">
              Koszykówka z Bobolic
            </h1>
            <p className="club-hero__lead">
              Jesteśmy drużyną koszykówki z Bobolic. Gramy w lidze KALK, organizujemy turnieje i łączymy ludzi wokół sportu.
            </p>
            <nav className="tabs club-hero__nav" aria-label="Sekcje strony klubu">
              <a href="#dzialalnosc">Działalność</a>
              <a href="#stroje">Stroje</a>
              <a href="#wsparcie">Wsparcie 1,5%</a>
              <a href="#kontakt">Kontakt</a>
            </nav>
          </div>
          <img className="club-hero__crest" src="/brand/herb2-kolor.svg" width={320} height={308} alt="BeKaPaKa Bobolice — Znak główny 2.0" />
        </div>
        <JerseyStripes className="band__stripes" />
      </section>

      <Band theme="papier" id="dzialalnosc" labelledBy="h-about">
        <div className="split split--7-5 club-about">
          <div className="club-about__text">
            <p className="kicker">Kim jesteśmy</p>
            <h2 id="h-about" className="band-head__title">Stowarzyszenie i drużyna</h2>
            <p className="club-about__lead">
              <strong>{siteSettings.organizationName}</strong> to stowarzyszenie pasjonatów i amatorów koszykówki z Bobolic oraz okolicznych miejscowości. Nasza
              drużyna reprezentuje miasto i gminę w Koszalińskiej Amatorskiej Lidze Koszykówki.
            </p>
          </div>
          <dl className="facts facts--large" aria-label="Klub w skrócie">
            <div>
              <dt>Miasto</dt>
              <dd>Bobolice</dd>
            </div>
            <div>
              <dt>Rozgrywki</dt>
              <dd>KALK · Dywizja II</dd>
            </div>
            <div>
              <dt>Mecze ligowe</dt>
              <dd>KOSiR Koszalin · wstęp wolny</dd>
            </div>
            <div>
              <dt>Turniej o Puchar Burmistrza</dt>
              <dd>Hala CESiR, Bobolice</dd>
            </div>
          </dl>
        </div>
        <ol className="pillars" role="list">
          {pillars.map((pillar, index) => (
            <li key={pillar.label} className="pillar">
              <span className="pillar__number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="pillar__label">{pillar.label}</p>
              <h3 className="pillar__title">{pillar.title}</h3>
              <p className="pillar__text">{pillar.text}</p>
              <ArrowLink href={pillar.href}>{pillar.link}</ArrowLink>
            </li>
          ))}
        </ol>
      </Band>

      <Band id="stroje" labelledBy="h-stroje">
        <BandHead kicker="Barwy klubu" title="Stroje meczowe" titleId="h-stroje">
          Strój A: czerń z czerwonym V. Strój B: granat z pomarańczem — ta sama drużyna w drugim komplecie.
        </BandHead>
        <JerseyShowcase />
      </Band>

      <Band theme="papier" labelledBy="h-reports">
        <BandHead kicker="Z życia klubu" title="Relacje z wydarzeń" titleId="h-reports" action={<ArrowLink href="/aktualnosci">Wszystkie aktualności</ArrowLink>} />
        {reports.length ? (
          <ul className="rule-list club-reports" role="list">
            {reports.map((item) => (
              <li key={item.id}>
                <Story item={item} variant="item" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-line">Relacje pojawią się po publikacji przez redakcję.</p>
        )}
        <div id="wsparcie" className="club-support">
          <FsmmSupportSection />
        </div>
      </Band>

      <Band id="kontakt" labelledBy="club-contact-heading" className="club-contact">
        <div className="split split--7-5">
          <div>
            <p className="kicker">Porozmawiajmy</p>
            <h2 id="club-contact-heading" className="band-head__title">
              Kontakt z klubem
            </h2>
            <p className="club-contact__lead">Chcesz wesprzeć drużynę, zapytać o działalność albo zagrać z nami? Napisz.</p>
          </div>
          <div className="club-contact__details">
            <a className="club-contact__email" href={`mailto:${siteSettings.contactEmail}`}>
              {siteSettings.contactEmail}
            </a>
            <p className="muted">{siteSettings.organizationName}</p>
            <ArrowLink href="/dokumenty">Dokumenty stowarzyszenia</ArrowLink>
          </div>
        </div>
      </Band>
    </div>
  )
}
