import { FSMM_SUPPORT } from '../../../lib/fsmm-support'
import { ArrowRightIcon, PercentIcon } from '../shared/PublicIcons'
import { DonationSupportPanel } from './DonationSupportPanel'

type FsmmSupportSectionProps = {
  variant?: 'dashboard' | 'page' | 'home'
}

export function FsmmSupportSection({ variant = 'dashboard' }: FsmmSupportSectionProps) {
  const isDashboard = variant === 'dashboard'
  const rootClass = isDashboard
    ? 'card dashboard-fsmm-support'
    : variant === 'home' ? 'fsmm-support-page fsmm-support-home container' : 'fsmm-support-page'

  return (
    <article id={variant === 'page' ? undefined : 'wsparcie'} className={rootClass} aria-labelledby='fsmm-support-heading'>
      <div className='section-head'>
        <div>
          <p className='label accent'>Wsparcie inicjatywy</p>
          <h2 id='fsmm-support-heading'>Wesprzyj BeKaPaKa</h2>
        </div>
      </div>

      {variant === 'home' ? <p className='muted'>Wesprzyj klub: przekaż 1,5% podatku lub darowiznę.</p> : <p className='fsmm-support-intro muted'>
        Twoje wsparcie pomaga rozwijać koszykówkę w Bobolicach — od treningów drużyny po mecze
        ligowe i turnieje. Możesz przekazać 1,5% podatku lub zasilić stowarzyszenie darowizną na nasz rachunek bankowy.
      </p>}

      <div className='fsmm-support-grid'>
        <section className='fsmm-support-panel fsmm-support-panel--tax' aria-labelledby='fsmm-tax-heading'>
          <div className='fsmm-support-panel__icon' aria-hidden='true'>
            <PercentIcon size={22} />
          </div>
          <h3 id='fsmm-tax-heading'>Przekaż 1,5% podatku</h3>
          {variant !== 'home' && <p className='muted'>
            W zeznaniu PIT wskaż organizację pożytku publicznego i cel szczegółowy — rozliczenie
            możesz zrobić także przez darmowy program na stronie FSMM.
          </p>}
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

        <DonationSupportPanel showClubLink={isDashboard} compact={variant === 'home'} />
      </div>
    </article>
  )
}
