'use client'

import { useState } from 'react'
import { BKPK_DONATION } from '../../../lib/bkpk-donation'
import { DonationQrModal } from './DonationQrModal'

export function DonationSupportPanel() {
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
      <section className="support__col" aria-labelledby="fsmm-donate-heading">
        <h3 id="fsmm-donate-heading" className="support__title">
          Darowizna na konto klubu
        </h3>
        <p className="support__text">
          Kwotę wybierasz samodzielnie. W tytule przelewu wpisz &bdquo;{BKPK_DONATION.transferTitle}&rdquo;.
        </p>
        <dl className="facts">
          <div>
            <dt>Rachunek bankowy · {BKPK_DONATION.bankName}</dt>
            <dd className="tnum facts__account">{BKPK_DONATION.bankAccountDisplay}</dd>
          </div>
          <div>
            <dt>Tytuł przelewu</dt>
            <dd>{BKPK_DONATION.transferTitle}</dd>
          </div>
        </dl>
        <p className="support__status" role="status">
          {copyStatus === 'copied' ? 'Numer konta skopiowany.' : copyStatus === 'error' ? 'Nie udało się skopiować. Zaznacz i skopiuj numer powyżej.' : ''}
        </p>
        <div className="support__actions actions">
          <button type="button" className="btn btn--primary" onClick={handleCopy}>
            Kopiuj numer konta
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => setIsQrModalOpen(true)}>
            Kod QR do przelewu
          </button>
        </div>
      </section>
      <DonationQrModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />
    </>
  )
}
