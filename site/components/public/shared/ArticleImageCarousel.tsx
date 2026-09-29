'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getStrapiMediaProps } from '../../../lib/data/media'

interface ImageInfo {
  src: string
  alt: string
}

interface ArticleImageCarouselProps {
  images: ImageInfo[]
}

const SWIPE_THRESHOLD = 50

function isFilename(text: string): boolean {
  if (!text) return true
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(text)) return true
  if (/^[a-f0-9-]{12,}$/i.test(text)) return true
  return /^[a-zA-Z0-9_-]+$/.test(text) && /[-_]/.test(text) && text.length > 10
}

function ChevronLeftIcon() {
  return (
    <svg aria-hidden='true' viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' strokeWidth='3.5' strokeLinecap='round' strokeLinejoin='round'>
      <path d='m14 17-5-5 5-5' />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden='true' viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' strokeWidth='3.5' strokeLinecap='round' strokeLinejoin='round'>
      <path d='m10 17 5-5-5-5' />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden='true' viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round'>
      <path d='M18 6 6 18M6 6l12 12' />
    </svg>
  )
}

export function ArticleImageCarousel({ images }: ArticleImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const lightboxTriggerRef = useRef<HTMLButtonElement | null>(null)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const scrollFrame = useRef<number | null>(null)
  const lightboxThumbsRef = useRef<HTMLDivElement>(null)

  // Guard against scroll-event race conditions during programmatic navigation (arrow/dot clicks)
  const isProgrammaticScrollRef = useRef(false)
  const programmaticTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentIndexRef = useRef(currentIndex)
  currentIndexRef.current = currentIndex

  const imageCount = images.length
  const hasManyImages = imageCount > 10

  const getSlideOffset = useCallback((index: number): number => {
    const track = trackRef.current
    if (!track) return 0
    const slides = track.children
    if (slides[index] && slides[index] instanceof HTMLElement) {
      return (slides[index] as HTMLElement).offsetLeft
    }
    return track.clientWidth * index
  }, [])

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const track = trackRef.current
    if (!track) return

    // Lock scroll-event processing so intermediate frames don't bounce the active slide
    isProgrammaticScrollRef.current = true
    if (programmaticTimeoutRef.current) {
      clearTimeout(programmaticTimeoutRef.current)
    }

    const targetOffset = getSlideOffset(index)
    track.scrollTo({ left: targetOffset, behavior })

    // Release lock once smooth scrolling has settled
    programmaticTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false
    }, 450)
  }, [getSlideOffset])

  const goToIndex = useCallback((index: number, syncTrack = true) => {
    if (imageCount === 0) return
    const normalizedIndex = (index + imageCount) % imageCount
    const isWrap = Math.abs(normalizedIndex - currentIndexRef.current) > 1

    setCurrentIndex(normalizedIndex)

    if (syncTrack) {
      // Use instant scroll for wrap-around jumps so it doesn't rewind through the whole gallery
      scrollToIndex(normalizedIndex, isWrap ? 'auto' : 'smooth')
    }
  }, [imageCount, scrollToIndex])

  const showPrevious = useCallback(() => {
    goToIndex(currentIndexRef.current - 1)
  }, [goToIndex])

  const showNext = useCallback(() => {
    goToIndex(currentIndexRef.current + 1)
  }, [goToIndex])

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false)
    scrollToIndex(currentIndexRef.current, 'auto')
    window.requestAnimationFrame(() => lightboxTriggerRef.current?.focus())
  }, [scrollToIndex])

  // Track listener: only updates active index during manual user swipes/gestures
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const updateCurrentSlide = () => {
      // Ignore scroll events triggered by programmatic button/dot clicks
      if (isProgrammaticScrollRef.current) return

      if (scrollFrame.current !== null) {
        window.cancelAnimationFrame(scrollFrame.current)
      }

      scrollFrame.current = window.requestAnimationFrame(() => {
        if (!track.clientWidth || isProgrammaticScrollRef.current) return

        const currentScroll = track.scrollLeft
        const slides = track.children
        let closestIndex = currentIndexRef.current
        let minDistance = Infinity

        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i] as HTMLElement
          const dist = Math.abs(slide.offsetLeft - currentScroll)
          if (dist < minDistance) {
            minDistance = dist
            closestIndex = i
          }
        }

        if (closestIndex !== currentIndexRef.current && closestIndex >= 0 && closestIndex < imageCount) {
          setCurrentIndex(closestIndex)
        }
      })
    }

    const handleScrollEnd = () => {
      isProgrammaticScrollRef.current = false
      if (programmaticTimeoutRef.current) {
        clearTimeout(programmaticTimeoutRef.current)
      }
    }

    track.addEventListener('scroll', updateCurrentSlide, { passive: true })
    track.addEventListener('scrollend', handleScrollEnd)

    return () => {
      track.removeEventListener('scroll', updateCurrentSlide)
      track.removeEventListener('scrollend', handleScrollEnd)
      if (scrollFrame.current !== null) {
        window.cancelAnimationFrame(scrollFrame.current)
      }
      if (programmaticTimeoutRef.current) {
        clearTimeout(programmaticTimeoutRef.current)
      }
    }
  }, [imageCount])

  // Resize listener: keeps the current slide aligned when container size changes
  useEffect(() => {
    const handleResize = () => scrollToIndex(currentIndexRef.current, 'auto')
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [scrollToIndex])

  // Keyboard navigation & focus trap for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox()
      if (event.key === 'ArrowLeft') showPrevious()
      if (event.key === 'ArrowRight') showNext()
      if (event.key === 'Tab') {
        const modal = closeButtonRef.current?.closest('[role="dialog"]')
        const focusable = modal?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeLightbox, isLightboxOpen, showNext, showPrevious])

  // Automatically scroll active thumbnail into center view in lightbox
  useEffect(() => {
    if (!isLightboxOpen || !lightboxThumbsRef.current) return
    const track = lightboxThumbsRef.current
    const activeThumb = track.children[currentIndex] as HTMLElement | undefined
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [currentIndex, isLightboxOpen])

  if (imageCount === 0) return null

  const currentImage = images[currentIndex]
  const caption = currentImage.alt && !isFilename(currentImage.alt) ? currentImage.alt : null

  const handleCarouselKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      showPrevious()
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      showNext()
    }
  }

  const openLightbox = (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    lightboxTriggerRef.current = event.currentTarget
    goToIndex(index)
    setIsLightboxOpen(true)
  }

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.targetTouches[0]?.clientX ?? null
    touchEndX.current = null
  }

  const handleTouchMove = (event: React.TouchEvent) => {
    touchEndX.current = event.targetTouches[0]?.clientX ?? null
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const distance = touchStartX.current - touchEndX.current
    if (distance > SWIPE_THRESHOLD) showNext()
    if (distance < -SWIPE_THRESHOLD) showPrevious()
    touchStartX.current = null
    touchEndX.current = null
  }

  return (
    <section
      className='article-gallery'
      role='region'
      aria-roledescription='karuzela'
      aria-label={`Galeria zdjęć, ${imageCount} ${imageCount === 1 ? 'zdjęcie' : 'zdjęć'}`}
      tabIndex={0}
      onKeyDown={handleCarouselKeyDown}
    >
      <div className='article-gallery__stage'>
        <div className='article-gallery__track' ref={trackRef}>
          {images.map((image, index) => {
            const mediaProps = getStrapiMediaProps(image.src, {
              sizes: '(max-width: 767px) 100vw, (max-width: 1100px) 90vw, 840px'
            })

            return (
              <div
                className='article-gallery__slide'
                role='group'
                aria-roledescription='slajd'
                aria-label={`${index + 1} z ${imageCount}`}
                aria-hidden={currentIndex !== index}
                key={`${image.src}-${index}`}
              >
                <button
                  className='article-gallery__image-button'
                  type='button'
                  tabIndex={currentIndex === index ? 0 : -1}
                  aria-label={`Otwórz zdjęcie ${index + 1} z ${imageCount} na pełnym ekranie`}
                  onClick={(event) => openLightbox(event, index)}
                >
                  <img
                    {...mediaProps}
                    alt={image.alt || `Zdjęcie ${index + 1}`}
                    className='article-gallery__image'
                    loading='lazy'
                    fetchPriority='auto'
                    draggable={false}
                  />
                </button>
              </div>
            )
          })}
        </div>

        {imageCount > 1 && (
          <>
            <button className='article-gallery__arrow article-gallery__arrow--prev' type='button' onClick={showPrevious} aria-label='Poprzednie zdjęcie'>
              <ChevronLeftIcon />
            </button>
            <button className='article-gallery__arrow article-gallery__arrow--next' type='button' onClick={showNext} aria-label='Następne zdjęcie'>
              <ChevronRightIcon />
            </button>
          </>
        )}
      </div>

      <div className='article-gallery__footer'>
        {caption && <p className='article-gallery__caption'>{caption}</p>}
        {imageCount > 1 && (
          <div className='article-gallery__status'>
            {hasManyImages ? (
              <div className='article-gallery__progress' aria-hidden='true'>
                <span style={{ width: `${((currentIndex + 1) / imageCount) * 100}%` }} />
              </div>
            ) : (
              <div className='article-gallery__dots' aria-label='Wybierz zdjęcie'>
                {images.map((image, index) => (
                  <button
                    className={`article-gallery__dot${currentIndex === index ? ' article-gallery__dot--active' : ''}`}
                    type='button'
                    aria-label={`Przejdź do zdjęcia ${index + 1}`}
                    aria-current={currentIndex === index ? 'true' : undefined}
                    onClick={() => goToIndex(index)}
                    key={`${image.src}-dot-${index}`}
                  />
                ))}
              </div>
            )}
            <span className='article-gallery__counter' aria-live='polite' aria-atomic='true'>
              {currentIndex + 1} / {imageCount}
            </span>
          </div>
        )}
      </div>

      {isLightboxOpen && createPortal(
        <div className='article-lightbox' role='dialog' aria-modal='true' aria-label={`Podgląd zdjęcia ${currentIndex + 1} z ${imageCount}`}>
          <button className='article-lightbox__scrim' type='button' onClick={closeLightbox} aria-label='Zamknij podgląd' />
          <button ref={closeButtonRef} className='article-lightbox__close-btn' type='button' onClick={closeLightbox} aria-label='Zamknij podgląd'>
            <CloseIcon />
          </button>

          {imageCount > 1 && (
            <>
              <button className='article-lightbox__nav-btn article-lightbox__nav-btn--prev' type='button' onClick={showPrevious} aria-label='Poprzednie zdjęcie'>
                <ChevronLeftIcon />
              </button>
              <button className='article-lightbox__nav-btn article-lightbox__nav-btn--next' type='button' onClick={showNext} aria-label='Następne zdjęcie'>
                <ChevronRightIcon />
              </button>
            </>
          )}

          <div className='article-lightbox__content' onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <img
              {...getStrapiMediaProps(currentImage.src, { isLightbox: true, sizes: '100vw' })}
              alt={currentImage.alt || `Zdjęcie ${currentIndex + 1}`}
              className='article-lightbox__image'
              draggable={false}
            />
            {(caption || imageCount > 1) && (
              <div className='article-lightbox__caption-panel'>
                {caption && <p className='article-lightbox__caption'>{caption}</p>}
                {imageCount > 1 && <span className='article-lightbox__counter'>{currentIndex + 1} / {imageCount}</span>}
              </div>
            )}
          </div>

          {imageCount > 1 && (
            <div className='article-lightbox__thumbs-bar' role='region' aria-label='Miniatury zdjęć galerii'>
              <div className='article-lightbox__thumbs-track' ref={lightboxThumbsRef}>
                {images.map((image, index) => {
                  const isCurrent = currentIndex === index
                  const thumbMedia = getStrapiMediaProps(image.src, { sizes: '96px' })
                  return (
                    <button
                      key={`lightbox-thumb-${index}`}
                      type='button'
                      className={`article-lightbox__thumb${isCurrent ? ' article-lightbox__thumb--active' : ''}`}
                      onClick={() => goToIndex(index)}
                      aria-label={`Przejdź do zdjęcia ${index + 1}`}
                      aria-current={isCurrent ? 'true' : undefined}
                    >
                      <img
                        src={thumbMedia.src}
                        alt={image.alt || `Miniatura ${index + 1}`}
                        className='article-lightbox__thumb-img'
                        loading='lazy'
                        draggable={false}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </section>
  )
}
