import { FSMM_SUPPORT } from '../../../lib/fsmm-support'
import { ArrowRightIcon, PercentIcon } from '../shared/PublicIcons'
import { DonationSupportPanel } from './DonationSupportPanel'

type FsmmSupportSectionProps = {
  variant?: 'dashboard' | 'page' | 'home'
}

export function FsmmSupportSection({ variant = 'dashboard' }: FsmmSupportSectionProps) {
  if (variant === 'home') {
    return (
      <section className="section" data-theme="papier" aria-labelledby="h-wes">
        <div className="container">
          <div className="grid">
            <div className="span-all l-span-5 stack" style={{ '--stack': 'var(--space-5)' } as React.CSSProperties}>
              <span className="tag tag--accent">Wsparcie</span>
              <h2 className="h1" id="h-wes">
                Wesprzyj BeKaPaKa
              </h2>
              <p className="t-lead measure" style={{ fontSize: 'var(--fs-lead)' }}>
                Twoje wsparcie pomaga rozwijać koszykówkę w Bobolicach — od treningów po mecze ligowe i turniej o Puchar Burmistrza.
              </p>
              <div className="stripes stripes--short">
                <i />
              </div>
            </div>

            <div className="span-all t-span-4 l-span-3 card" style={{ '--card-accent': 'var(--c-black)' } as React.CSSProperties}>
              <div className="card__body">
                <h3 className="h4">Przekaż 1,5% podatku</h3>
                <dl className="stack" style={{ '--stack': 'var(--space-3)' } as React.CSSProperties}>
                  <div>
                    <dt className="label muted">KRS Fundacji FSMM</dt>
                    <dd className="h3 tnum" style={{ margin: 0 }}>
                      {FSMM_SUPPORT.krs}
                    </dd>
                  </div>
                  <div>
                    <dt className="label muted">Cel szczegółowy</dt>
                    <dd className="h3" style={{ margin: 0 }}>
                      {FSMM_SUPPORT.purposeCode}
                    </dd>
                  </div>
                </dl>
                <div className="card__foot">
                  <a
                    className="btn btn--primary btn--sm"
                    href={FSMM_SUPPORT.panelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Rozlicz PIT{' '}
                    <svg
                      className="ico"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      aria-hidden="true"
                    >
                      <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <DonationSupportPanel variant="brandbook" />
          </div>
        </div>
      </section>
    )
  }

  const isDashboard = variant === 'dashboard'
  const rootClass = isDashboard
    ? 'card dashboard-fsmm-support'
    : 'fsmm-support-page'

  return (
    <article id='wsparcie' className={rootClass} aria-labelledby='fsmm-support-heading'>
      <div className='section-head'>
        <div>
          <p className='label accent'>Wsparcie inicjatywy</p>
          <h2 id='fsmm-support-heading'>Wesprzyj BeKaPaKa</h2>
        </div>
      </div>

      <p className='fsmm-support-intro muted'>
        Twoje wsparcie pomaga rozwijać koszykówkę w Bobolicach — od treningów drużyny po mecze
        ligowe i turnieje. Możesz przekazać 1,5% podatku lub zasilić stowarzyszenie darowizną na nasz rachunek bankowy.
      </p>

      <div className='fsmm-support-grid'>
        <section className='fsmm-support-panel fsmm-support-panel--tax' aria-labelledby='fsmm-tax-heading'>
          <div className='fsmm-support-panel__icon' aria-hidden='true'>
            <PercentIcon size={22} />
          </div>
          <h3 id='fsmm-tax-heading'>Przekaż 1,5% podatku</h3>
          <p className='muted'>
            W zeznaniu PIT wskaż organizację pożytku publicznego i cel szczegółowy — rozliczenie
            możesz zrobić także przez darmowy program na stronie FSMM.
          </p>
          <dl className='fsmm-support-facts'>
            <div className='fsmm-support-facts__row'>
              <dt>KRS Fundacji FSMM (program 1,5%)</dt>
              <dd>
                <code>{FSMM_SUPPORT.krs}</code>
              </dd>
            </div>
            <div className='fsmm-support-facts__row'>
              <dt>Cel szczegółowy</dt>
              <dd>
                <code>{FSMM_SUPPORT.purposeCode}</code>
              </dd>
            </div>
          </dl>
          <a
            href={FSMM_SUPPORT.panelUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='btn btn--primary button-with-icon fsmm-support-panel__cta'
          >
            Rozlicz PIT i przekaż 1,5%
            <ArrowRightIcon size={14} />
          </a>
        </section>

        <DonationSupportPanel showClubLink={isDashboard} />
      </div>
    </article>
  )
}
