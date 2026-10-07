'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { focusWithoutScroll, usePageScrollLock } from '@bekapaka/safari-overlay'
import { BKPK_DONATION, buildDonationQrPayload } from '../../../lib/bkpk-donation'
import { CloseIcon } from '../shared/PublicIcons'

type DonationQrModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function DonationQrModal({ isOpen, onClose }: DonationQrModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const [qrError, setQrError] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  useEffect(() => {
    if (!isOpen) return
    const shell = document.querySelector<HTMLElement>('.site-shell')
    const previous = shell?.inert || false
    if (shell) shell.inert = true
    return () => { if (shell) shell.inert = previous }
  }, [isOpen])

  usePageScrollLock(isOpen, { htmlClass: 'is-overlay-open' })

  useEffect(() => {
    if (!isOpen) {
      setQrDataUrl(null)
      setCopyStatus('idle')
      return
    }

    setQrError(false)
    let cancelled = false

    import('qrcode')
      .then(({ default: QRCode }) =>
        QRCode.toDataURL(buildDonationQrPayload(), {
          errorCorrectionLevel: 'L',
          margin: 2,
          width: 250,
          color: {
            dark: '#0a0a0a',
            light: '#ffffff'
          }
        })
      )
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) { setQrDataUrl(null); setQrError(true) }
      })

    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key === 'Tab') {
        const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button,a[href]') || [])
        const first = controls[0], last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }

    document.addEventListener('keydown', handleEsc)

    const frame = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('.donation-qr-modal__close')?.focus()
    })

    return () => {
      document.removeEventListener('keydown', handleEsc)
      cancelAnimationFrame(frame)

      if (previousFocusRef.current) {
        focusWithoutScroll(previousFocusRef.current)
      }
      previousFocusRef.current = null
    }
  }, [isOpen])

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BKPK_DONATION.bankAccountCopy)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  if (typeof document === 'undefined' || !isOpen) return null

  return createPortal(
    <div className="donation-qr-modal is-open" aria-hidden={false}>
      <button
        type="button"
        className="donation-qr-modal__backdrop"
        tabIndex={-1}
        onClick={() => onCloseRef.current()}
        aria-label="Zamknij okno darowizny"
      />
      <div
        ref={panelRef}
        className="donation-qr-modal__panel"
        data-theme="papier"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="donation-qr-modal__header">
          <h2 id={titleId} className="donation-qr-modal__title">
            Darowizna na konto stowarzyszenia
          </h2>
          <button
            type="button"
            className="icon-btn donation-qr-modal__close"
            onClick={() => onCloseRef.current()}
            aria-label="Zamknij"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="donation-qr-modal__body">
          <p className="donation-qr-modal__hint muted">
            Skopiuj dane do przelewu lub zeskanuj kod QR w aplikacji bankowej na telefonie.
          </p>

          <dl className="facts donation-qr-modal__facts">
            <div>
              <dt>Odbiorca</dt>
              <dd>
                {BKPK_DONATION.organizationName}
              </dd>
            </div>
            <div>
              <dt>Rachunek</dt>
              <dd>
                <span className="tnum facts__account">{BKPK_DONATION.bankAccountDisplay}</span>
                <span className="muted"> · {BKPK_DONATION.bankName}</span>
              </dd>
            </div>
            <div>
              <dt>Tytuł</dt>
              <dd>
                {BKPK_DONATION.transferTitle}
              </dd>
            </div>
          </dl>

          <div className="donation-qr-modal__actions actions">
            <button type="button" className="btn btn--primary" onClick={handleCopyAccount}>
              {copyStatus === 'copied'
                ? '✓ Skopiowano numer konta'
                : copyStatus === 'error'
                  ? 'Nie udało się skopiować'
                  : 'Kopiuj numer konta'}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => onCloseRef.current()}
            >
              Zamknij
            </button>
          </div>

          <p role="status">{copyStatus === 'copied' ? 'Numer konta skopiowany.' : copyStatus === 'error' ? 'Nie udało się skopiować. Zaznacz i skopiuj numer rachunku powyżej.' : ''}</p>
          <div className="donation-qr-modal__qr-wrap" aria-busy={!qrDataUrl && !qrError}>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Kod QR do przelewu na rachunek stowarzyszenia BeKaPaKa"
                width={250}
                height={250}
                className="donation-qr-modal__qr"
              />
            ) : qrError ? <p role="status">Kod QR jest niedostępny. Skorzystaj z numeru rachunku powyżej.</p> : (
              <div className="donation-qr-modal__qr-skeleton" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
