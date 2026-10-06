'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BKPK_DONATION } from '../../../lib/bkpk-donation'
import { ArrowRightIcon, HeartIcon } from '../shared/PublicIcons'
import { DonationQrModal } from './DonationQrModal'

type DonationSupportPanelProps = {
  compact?: boolean
  showClubLink?: boolean
}

export function DonationSupportPanel({
  showClubLink = false,
  compact = false,
}: DonationSupportPanelProps) {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(BKPK_DONATION.bankAccountCopy)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }


  return (
    <>
      <section
        className="fsmm-support-panel fsmm-support-panel--donate"
        aria-labelledby="fsmm-donate-heading"
      >
        <div className="fsmm-support-panel__icon" aria-hidden="true">
          <HeartIcon size={22} />
        </div>
        <h3 id="fsmm-donate-heading">Wesprzyj indywidualnie</h3>
        {!compact && <p className="muted">
          Darowiznę możesz wpłacić bezpośrednim przelewem na rachunek stowarzyszenia. W tytule przelewu wpisz
          &bdquo;{BKPK_DONATION.transferTitle}&rdquo; — kwotę wybierasz samodzielnie.
        </p>}
        <dl className="fsmm-support-facts">
          <div className="fsmm-support-facts__row">
            <dt>Rachunek bankowy</dt>
            <dd>
              <code className="fsmm-support-account">{BKPK_DONATION.bankAccountDisplay}</code>
              <span className="muted fsmm-support-bank-name">{BKPK_DONATION.bankName}</span>
            </dd>
          </div>
          <div className="fsmm-support-facts__row">
            <dt>Tytuł przelewu</dt>
            <dd>
              <code>{BKPK_DONATION.transferTitle}</code>
            </dd>
          </div>
        </dl>
        <p role="status">{copyStatus === 'copied' ? 'Numer konta skopiowany.' : copyStatus === 'error' ? 'Nie udało się skopiować. Zaznacz i skopiuj numer powyżej.' : ''}</p>
        <div className="fsmm-support-panel__actions">
          <button type="button" className="btn btn--primary" onClick={handleCopy}>Kopiuj numer konta</button>
          <button
            type="button"
            className="btn btn--primary button-with-icon"
            onClick={() => setIsQrModalOpen(true)}
          >
            Pokaż kod QR do przelewu
            <ArrowRightIcon size={14} />
          </button>
          {showClubLink ? (
            <Link href="/klub" className="btn btn--secondary">
              Więcej o klubie
            </Link>
          ) : null}
        </div>
      </section>

      <DonationQrModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />
    </>
  )
}
