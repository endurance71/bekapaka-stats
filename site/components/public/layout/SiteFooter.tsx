import Link from 'next/link'
import { siteSettings } from '../../../lib/site-settings'

export function SiteFooter() {
  return (
    <footer className="site-footer" data-theme="plyta">
      <div className="container">
        <div className="site-footer__top">
          <div className="stack site-footer__brand" style={{ '--stack': 'var(--space-5)' } as React.CSSProperties}>
            <img
              src="/brand/herb2-kolor.svg"
              width={160}
              height={154}
              loading="lazy"
              alt="BeKaPaKa Bobolice — Znak główny 2.0"
            />
            <p className="muted" style={{ maxWidth: '34ch' }}>
              BeKaPaKa — koszykówka z Bobolic, drużyna KALK.
            </p>
          </div>
          <div>
            <h2>Kontakt</h2>
            <address>
              {siteSettings.organizationName}
              <br />
              {siteSettings.associationKrs && <>KRS: {siteSettings.associationKrs}<br /></>}
              <a href={`mailto:${siteSettings.contactEmail}`}>{siteSettings.contactEmail}</a>
            </address>
          </div>
          <div className="site-footer__nav">
            <h2>Klub</h2>
            <ul>
              <li>
                <Link href="/aktualnosci">Aktualności</Link>
              </li>
              <li>
                <Link href="/mecze">Mecze</Link>
              </li>
              <li>
                <Link href="/sklad">Skład</Link>
              </li>
              <li>
                <Link href="/sponsorzy">Partnerzy</Link>
              </li>
              <li>
                <Link href="/klub">O klubie</Link>
              </li>
              <li><Link href="/dokumenty">Dokumenty</Link></li>
            </ul>
          </div>
          <div>
            <h2>Wesprzyj</h2>
            <p className="muted">
              1,5% podatku przez Fundację FSMM: KRS 0000270261,
              <br />
              cel szczegółowy BKPK 23372
            </p>
            <p style={{ marginTop: 'var(--space-4)' }}>
              <Link className="btn btn--primary btn--sm" href="/klub#wsparcie">
                Jak wesprzeć
              </Link>
            </p>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>
            © {new Date().getFullYear()} {siteSettings.organizationName}
            {siteSettings.associationKrs ? ` · KRS ${siteSettings.associationKrs}` : ''}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            {siteSettings.privacyUrl && (
              <>
                <Link href={siteSettings.privacyUrl}>Polityka prywatności</Link>
                {' · '}
              </>
            )}
            <a href="https://panel.bekapaka.pl">Panel statystyk</a>
            {' · '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Powered by{' '}
              <a
                href="https://shipapp.pl"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ShipApp"
                style={{ display: 'inline-flex', alignItems: 'center', minHeight: 'auto', padding: '0 2px' }}
              >
                <img
                  src="/brand/shipapp-logo-white.svg"
                  alt="ShipApp"
                  width={78}
                  height={16}
                  loading="lazy"
                  style={{ height: '16px', width: 'auto', opacity: 0.9 }}
                />
              </a>
            </span>
          </span>
        </div>
      </div>
    </footer>
  )
}
