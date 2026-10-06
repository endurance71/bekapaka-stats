'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BKPK_DONATION } from '../../../lib/bkpk-donation'
import { ArrowRightIcon, HeartIcon } from '../shared/PublicIcons'
import { DonationQrModal } from './DonationQrModal'

type DonationSupportPanelProps = {
  variant?: 'brandbook' | 'default'
  showClubLink?: boolean
}

export function DonationSupportPanel({
  variant = 'default',
  showClubLink = false,
}: DonationSupportPanelProps) {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(BKPK_DONATION.bankAccountCopy)
      setCopyStatus('copied')
      window.setTimeout(() => setCopyStatus('idle'), 2000)
    } catch {
      setCopyStatus('error')
      window.setTimeout(() => setCopyStatus('idle'), 2500)
    }
  }

  if (variant === 'brandbook') {
    return (
      <>
        <div className="span-all t-span-4 l-span-4 card" style={{ '--card-accent': 'var(--c-black)' } as React.CSSProperties}>
          <div className="card__body">
            <h3 className="h4">Darowizna przelewem</h3>
            <dl className="stack" style={{ '--stack': 'var(--space-3)' } as React.CSSProperties}>
              <div>
                <dt className="label muted">Rachunek · {BKPK_DONATION.bankName}</dt>
                <dd className="tnum" style={{ margin: 0, font: '600 19px/1.4 var(--font-text)' }}>
                  {BKPK_DONATION.bankAccountDisplay}
                </dd>
              </div>
              <div>
                <dt className="label muted">Tytuł</dt>
                <dd style={{ margin: 0 }}>{BKPK_DONATION.transferTitle}</dd>
              </div>
            </dl>
            <div className="card__foot">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setIsQrModalOpen(true)}
              >
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
                  <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" />
                </svg>
                Kod QR
              </button>
              <button
                type="button"
                className="btn btn--text"
                onClick={handleCopy}
              >
                {copyStatus === 'copied' ? 'Skopiowano!' : 'Kopiuj numer'}
              </button>
            </div>
          </div>
        </div>
        <DonationQrModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />
      </>
    )
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
        <p className="muted">
          Darowiznę możesz wpłacić bezpośrednim przelewem na rachunek stowarzyszenia. W tytule przelewu wpisz
          &bdquo;{BKPK_DONATION.transferTitle}&rdquo; — kwotę wybierasz samodzielnie.
        </p>
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
        <div className="fsmm-support-panel__actions">
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
