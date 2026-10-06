'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon, ArrowRightIcon } from './PublicIcons'
import { FallbackImage } from './FallbackImage'
type ImageInfo = { src: string; alt: string; caption?: string; author?: string; width?: number; height?: number; metadataMissing?: boolean }
export function ArticleImageCarousel({ images, variant = 'gallery' }: { images: ImageInfo[]; variant?: 'gallery' | 'cover' }) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const selectImage = (next: number) => { setImageState('loading'); setIndex(next) }
  const [index, setIndex] = useState<number | null>(null)
  const modal = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const start = useRef<number | null>(null)
  const open = index !== null
  useEffect(() => {
    if (!open) return
    const shell = document.querySelector<HTMLElement>('.site-shell')
    const wasInert = shell?.inert || false
    if (shell) shell.inert = true
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
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
      document.body.style.overflow = oldOverflow
      document.removeEventListener('keydown', keyboard)
      trigger.current?.focus()
    }
  }, [open, images.length])
  if (!images.length) return null
  const active = index === null ? null : images[index]
  return (
    <div className={`article-gallery${variant === 'cover' ? ' article-gallery--cover' : ''}`}>
      <div className="article-gallery__grid">
        {images.map((image, i) => (
          <figure key={`${image.src}-${i}`}>
            <button
              className="article-gallery__image-button"
              type="button"
              aria-label={`Powiększ zdjęcie: ${image.alt}`}
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
                sizes={variant === 'cover' ? '(max-width: 1023px) calc(100vw - 32px), (max-width: 1440px) 40vw, 560px' : i === 0 ? '(max-width: 1023px) calc((100vw - 44px)/2), (max-width: 1440px) 32vw, 457px' : '(max-width: 1023px) calc((100vw - 44px)/2), (max-width: 1440px) 16vw, 223px'}
                alt={image.alt}
              />
            </button>
            {(image.caption || image.author || image.metadataMissing || variant === 'cover') && (
              <figcaption>
                {variant === 'cover' && <span>Powiększ okładkę · </span>}{image.metadataMissing && <span>Podgląd lokalny: opis i autor wymagają uzupełnienia. </span>}{image.caption}
                {image.author && ` · Fot. ${image.author}`}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
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
              )
                setImageState('loading')
                setIndex(
                  (value) =>
                    ((value || 0) +
                      (event.changedTouches[0].clientX < start.current! ? 1 : -1) +
                      images.length) %
                    images.length
                )
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
