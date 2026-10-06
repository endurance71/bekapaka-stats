'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FallbackImage } from './FallbackImage'
type ImageInfo = { src: string; alt: string; caption?: string; author?: string }
export function ArticleImageCarousel({ images }: { images: ImageInfo[] }) {
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
      if (event.key === 'ArrowRight') setIndex((value) => ((value || 0) + 1) % images.length)
      if (event.key === 'ArrowLeft')
        setIndex((value) => ((value || 0) - 1 + images.length) % images.length)
      if (event.key === 'Tab') {
        const buttons = Array.from(
          modal.current?.querySelectorAll<HTMLButtonElement>('button') || []
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
    <div className="article-gallery">
      <div className="article-gallery__grid">
        {images.map((image, i) => (
          <figure key={`${image.src}-${i}`}>
            <button
              className="article-gallery__image-button"
              type="button"
              aria-label={`Powiększ zdjęcie: ${image.alt}`}
              onClick={(event) => {
                trigger.current = event.currentTarget
                setIndex(i)
              }}
            >
              <FallbackImage
                className="article-gallery__image"
                src={image.src}
                width={800}
                height={600}
                sizes="(max-width: 768px) 50vw, 33vw"
                alt={image.alt}
              />
            </button>
            {(image.caption || image.author) && (
              <figcaption>
                {image.caption}
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
              ×
            </button>
            <button
              className="article-lightbox__prev"
              onClick={() => setIndex(((index || 0) - 1 + images.length) % images.length)}
              type="button"
              aria-label="Poprzednie zdjęcie"
            >
              ←
            </button>
            <figure className="article-lightbox__figure">
              <img src={active.src} alt={active.alt} />
              <figcaption>
                {active.caption ? <span>{active.caption}</span> : null}
                {active.author ? <span> · Fot. {active.author}</span> : null}
                {active.caption || active.author ? <span> · </span> : null}
                <span className="article-lightbox__counter">
                  {(index || 0) + 1} z {images.length}
                </span>
              </figcaption>
            </figure>
            <button
              className="article-lightbox__next"
              onClick={() => setIndex(((index || 0) + 1) % images.length)}
              type="button"
              aria-label="Następne zdjęcie"
            >
              →
            </button>
          </div>,
          document.body
        )}
    </div>
  )
}
