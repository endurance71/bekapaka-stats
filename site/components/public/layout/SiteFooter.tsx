import Link from 'next/link'
import { FSMM_SUPPORT } from '../../../lib/fsmm-support'
import { siteSettings } from '../../../lib/site-settings'
import { JerseyStripes } from '../primitives/JerseyStripes'
import { navItems } from '../../../lib/navigation'

export function SiteFooter() {
  return (
    <footer className="site-footer" data-theme="plyta">
      <JerseyStripes className="site-footer__stripes" />
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <img src="/brand/herb2-kolor.svg" width={160} height={154} loading="lazy" alt="BeKaPaKa Bobolice — Znak główny 2.0" />
            <p>Drużyna koszykówki z Bobolic. Gramy w KALK, organizujemy Turniej o Puchar Burmistrza Bobolic.</p>
          </div>
          <nav className="site-footer__col" aria-labelledby="footer-club">
            <h2 id="footer-club" className="t-label">Strona</h2>
            <ul role="list">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/dokumenty">Dokumenty</Link>
              </li>
            </ul>
          </nav>
          <div className="site-footer__col">
            <h2 className="t-label">Kontakt</h2>
            <address>
              {siteSettings.organizationName}
              {siteSettings.associationKrs && (
                <>
                  <br />
                  KRS {siteSettings.associationKrs}
                </>
              )}
              <br />
              <a href={`mailto:${siteSettings.contactEmail}`}>{siteSettings.contactEmail}</a>
            </address>
          </div>
          <div className="site-footer__col">
            <h2 className="t-label">Wesprzyj</h2>
            <p>
              1,5% podatku: KRS <span className="tnum">{FSMM_SUPPORT.krs}</span>, cel szczegółowy{' '}
              <span className="tnum">{FSMM_SUPPORT.purposeCode}</span>
            </p>
            <Link className="arrow-link" href="/klub#wsparcie">
              <span>Jak wesprzeć klub</span>
            </Link>
          </div>
        </div>
        <p className="site-footer__signoff" aria-hidden="true">
          <span className="cut">BEKAPAKA</span>
        </p>
        <div className="site-footer__bottom">
          <span>
            © {new Date().getFullYear()} {siteSettings.organizationName}
          </span>
          <span className="site-footer__links">
            {siteSettings.privacyUrl && <Link href={siteSettings.privacyUrl}>Polityka prywatności</Link>}
            <a href="https://panel.bekapaka.pl">Panel statystyk</a>
            <a className="site-footer__maker" href="https://shipapp.pl" target="_blank" rel="noopener noreferrer">
              Powered by
              <img src="/brand/shipapp-logo-white.svg" alt="ShipApp" width={78} height={16} loading="lazy" />
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
