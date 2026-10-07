import { FSMM_SUPPORT } from '../../../lib/fsmm-support'
import { DonationSupportPanel } from './DonationSupportPanel'

/** Wsparcie klubu: 1,5% podatku przez FSMM i darowizna — dwie kolumny z danymi do przepisania. */
export function FsmmSupportSection() {
  return (
    <section className="support" aria-labelledby="fsmm-support-heading">
      <header className="support__head">
        <p className="kicker">Wsparcie</p>
        <h2 id="fsmm-support-heading" className="band-head__title">
          Wesprzyj BeKaPaKa
        </h2>
        <p className="support__intro">
          Twoje wsparcie pomaga rozwijać koszykówkę w Bobolicach — od treningów drużyny po mecze ligowe i turnieje. Możesz przekazać 1,5% podatku albo
          wpłacić darowiznę na konto stowarzyszenia.
        </p>
      </header>
      <div className="support__grid">
        <section className="support__col" aria-labelledby="fsmm-tax-heading">
          <h3 id="fsmm-tax-heading" className="support__title">
            Przekaż 1,5% podatku
          </h3>
          <p className="support__text">
            W zeznaniu PIT wskaż organizację pożytku publicznego i cel szczegółowy. Rozliczenie możesz zrobić także w darmowym programie FSMM.
          </p>
          <dl className="facts">
            <div>
              <dt>KRS Fundacji FSMM (program 1,5%)</dt>
              <dd className="tnum">{FSMM_SUPPORT.krs}</dd>
            </div>
            <div>
              <dt>Cel szczegółowy</dt>
              <dd className="tnum">{FSMM_SUPPORT.purposeCode}</dd>
            </div>
          </dl>
          <div className="support__actions actions">
            <a href={FSMM_SUPPORT.panelUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
              Rozlicz PIT i przekaż 1,5%
            </a>
          </div>
        </section>
        <DonationSupportPanel />
      </div>
    </section>
  )
}
