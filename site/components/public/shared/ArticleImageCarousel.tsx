'use client'
import { useEffect, useRef, useState } from 'react'
import { usePageScrollLock } from '@bekapaka/safari-overlay'
import { createPortal } from 'react-dom'
import { CloseIcon, ArrowRightIcon } from './PublicIcons'
import { FallbackImage } from './FallbackImage'
type ImageInfo = { src: string; alt: string; caption?: string; author?: string; width?: number; height?: number; metadataMissing?: boolean }
/** Galeria w treści pokazuje najpierw 1 duże + 8 zdjęć; reszta po kliknięciu. Lightbox przegląda wszystkie. */
const GALLERY_PREVIEW = 9

export function ArticleImageCarousel({ images, variant = 'gallery' }: { images: ImageInfo[]; variant?: 'gallery' | 'cover' }) {
  const [expanded, setExpanded] = useState(false)
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const selectImage = (next: number) => { setImageState('loading'); setIndex(next) }
  const [index, setIndex] = useState<number | null>(null)
  const modal = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const start = useRef<number | null>(null)
  const open = index !== null
  usePageScrollLock(open, { htmlClass: 'is-overlay-open' })
  useEffect(() => {
    if (!open) return
    const shell = document.querySelector<HTMLElement>('.site-shell')
    const wasInert = shell?.inert || false
    if (shell) shell.inert = true
    modal.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIndex(null)
      }
      if (event.key === 'ArrowRight') { setImageState('loading'); setIndex((value) => ((value || 0) + 1) % images.length) }
      if (event.key === 'ArrowLeft') { setImageState('loading');
        setIndex((value) => ((value || 0) - 1 + images.length) % images.length) }
      if (event.key === 'Tab') {
        const buttons = Array.from(
          modal.current?.querySelectorAll<HTMLElement>('button,a[href]') || []
        )
        const first = buttons[0],
          last = buttons.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', keyboard)
    return () => {
      if (shell) shell.inert = wasInert
      document.removeEventListener('keydown', keyboard)
      trigger.current?.focus()
    }
  }, [open, images.length])
  if (!images.length) return null
  const active = index === null ? null : images[index]
  const visible = variant === 'cover' || expanded ? images : images.slice(0, GALLERY_PREVIEW)
  const hidden = images.length - visible.length
  return (
    <div className={`article-gallery${variant === 'cover' ? ' article-gallery--cover' : ''}`}>
      {variant !== 'cover' && images.some((image) => image.metadataMissing) && (
        <p className="article-gallery__notice">Podgląd lokalny: opisy i autorzy zdjęć wymagają uzupełnienia przed publikacją.</p>
      )}
      <div className="article-gallery__grid">
        {visible.map((image, i) => (
          <figure key={`${image.src}-${i}`}>
            <button
              className="article-gallery__image-button"
              type="button"
              aria-label={variant === 'cover' ? `Powiększ okładkę: ${image.alt}` : `Powiększ zdjęcie: ${image.alt}`}
              onClick={(event) => {
                trigger.current = event.currentTarget
                selectImage(i)
              }}
            >
              <FallbackImage
                className="article-gallery__image"
                src={image.src}
                width={image.width || 800}
                height={image.height || 600}
                sizes={variant === 'cover' ? '(max-width: 1023px) calc(100vw - 32px), min(660px, 42vw)' : i === 0 ? '(max-width: 767px) 100vw, min(800px, 50vw)' : '(max-width: 767px) 50vw, min(400px, 25vw)'}
                alt={image.alt}
                loading={variant === 'cover' ? 'eager' : 'lazy'}
                fetchPriority={variant === 'cover' ? 'high' : 'auto'}
              />
              {variant === 'cover' && (
                <span className="article-gallery__zoom" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
                  </svg>
                </span>
              )}
            </button>
            {(image.caption || image.author || (variant === 'cover' && image.metadataMissing)) && (
              <figcaption>
                {[variant === 'cover' && image.metadataMissing ? 'Podgląd lokalny: opis i autor wymagają uzupełnienia.' : null, image.caption || null, image.author ? `Fot. ${image.author}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
      {hidden > 0 && (
        <button type="button" className="btn btn--secondary article-gallery__more" onClick={() => setExpanded(true)}>
          Pokaż wszystkie zdjęcia ({images.length})
        </button>
      )}
      {active &&
        createPortal(
          <div
            className="article-lightbox"
            ref={modal}
            role="dialog"
            aria-modal="true"
            aria-label="Galeria zdjęć"
            onTouchStart={(event) => {
              start.current = event.touches[0].clientX
            }}
            onTouchEnd={(event) => {
              if (
                start.current !== null &&
                Math.abs(event.changedTouches[0].clientX - start.current) > 50
              ) {
                setImageState('loading')
                setIndex(
                  (value) =>
                    ((value || 0) +
                      (event.changedTouches[0].clientX < start.current! ? 1 : -1) +
                      images.length) %
                    images.length
                )
              }
              start.current = null
            }}
          >
            <button
              className="article-lightbox__close"
              onClick={() => setIndex(null)}
              type="button"
              aria-label="Zamknij galerię"
            >
              <CloseIcon size={24} />
            </button>
            <button
              className="article-lightbox__prev"
              onClick={() => selectImage(((index || 0) - 1 + images.length) % images.length)}
              type="button"
              aria-label="Poprzednie zdjęcie"
            >
              <ArrowRightIcon size={24} className="icon-back" />
            </button>
            <figure className="article-lightbox__figure">
              <p role="status" className="article-lightbox__status">{imageState === 'loading' ? 'Ładowanie zdjęcia…' : imageState === 'error' ? 'Nie udało się pobrać zdjęcia.' : ''}</p>
              {imageState === 'error' && <button type="button" className="btn btn--secondary" onClick={() => { setImageState('loading'); setAttempt(attempt + 1) }}>Spróbuj ponownie</button>}
              <img key={`${active.src}-${attempt}`} src={active.src} alt={active.alt} onLoad={() => setImageState('loaded')} onError={() => setImageState('error')} hidden={imageState === 'error'} />
              <figcaption>
                {active.caption ? <span>{active.caption}</span> : null}
                {active.author ? <span> · Fot. {active.author}</span> : null}
                {active.caption || active.author ? <span> · </span> : null}
                <a href={active.src} target="_blank" rel="noopener noreferrer">Otwórz oryginał</a><span className="article-lightbox__counter">
                  {(index || 0) + 1} z {images.length}
                </span>
              </figcaption>
            </figure>
            <button
              className="article-lightbox__next"
              onClick={() => selectImage(((index || 0) + 1) % images.length)}
              type="button"
              aria-label="Następne zdjęcie"
            >
              <ArrowRightIcon size={24} />
            </button>
          </div>,
          document.body
        )}
    </div>
  )
}
