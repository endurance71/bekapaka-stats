import Link from 'next/link'
import { FSMM_SUPPORT } from '../../../lib/fsmm-support'
import { ArrowRightIcon, HeartIcon, PercentIcon } from '../shared/PublicIcons'

type FsmmSupportSectionProps = {
  variant?: 'dashboard' | 'page'
}

export function FsmmSupportSection({ variant = 'dashboard' }: FsmmSupportSectionProps) {
  const isDashboard = variant === 'dashboard'
  const rootClass = isDashboard
    ? 'surface-card dashboard-fsmm-support'
    : 'fsmm-support-page'

  return (
    <article className={rootClass} aria-labelledby='fsmm-support-heading'>
      <div className='section-head'>
        <div>
          <p className='section-kicker'>Fundacja Młodzi Młodym</p>
          <h2 id='fsmm-support-heading'>Wesprzyj BeKaPaKa</h2>
        </div>
        <a
          href={FSMM_SUPPORT.panelUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='fsmm-support-panel__link'
        >
          Strona FSMM
        </a>
      </div>

      <p className='fsmm-support-intro muted'>
        Bobolicki Klub Przyjaciół Koszykówki jest partnerem{' '}
        <strong>Fundacji Studenckiej Młodzi Młodym</strong>. Możesz przekazać 1,5% podatku lub
        wpłacić darowiznę na cele statutowe klubu.
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
              <dt>KRS</dt>
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
            className='button button--primary button-with-icon fsmm-support-panel__cta'
          >
            Rozlicz PIT i przekaż 1,5%
            <ArrowRightIcon size={14} />
          </a>
        </section>

        <section
          className='fsmm-support-panel fsmm-support-panel--donate'
          aria-labelledby='fsmm-donate-heading'
        >
          <div className='fsmm-support-panel__icon' aria-hidden='true'>
            <HeartIcon size={22} />
          </div>
          <h3 id='fsmm-donate-heading'>Wesprzyj indywidualnie</h3>
          <p className='muted'>
            Darowiznę możesz wpłacić przelewem lub przez płatność online (PayU) na panelu FSMM.
            W tytule przelewu wpisz kod celu.
          </p>
          <dl className='fsmm-support-facts'>
            <div className='fsmm-support-facts__row'>
              <dt>Rachunek bankowy</dt>
              <dd>
                <code className='fsmm-support-account'>{FSMM_SUPPORT.bankAccountDisplay}</code>
                <span className='muted fsmm-support-bank-name'>{FSMM_SUPPORT.bankName}</span>
              </dd>
            </div>
            <div className='fsmm-support-facts__row'>
              <dt>Tytuł przelewu</dt>
              <dd>
                <code>{FSMM_SUPPORT.transferTitle}</code>
              </dd>
            </div>
          </dl>
          <div className='fsmm-support-panel__actions'>
            <a
              href={FSMM_SUPPORT.panelUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='button button--primary button-with-icon'
            >
              Wpłać przez FSMM
              <ArrowRightIcon size={14} />
            </a>
            {!isDashboard ? null : (
              <Link href='/klub' className='button button--ghost'>
                Więcej o klubie
              </Link>
            )}
          </div>
        </section>
      </div>
    </article>
  )
}
