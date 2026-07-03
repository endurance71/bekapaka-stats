'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

interface ImageInfo {
  src: string
  alt: string
}

interface ArticleImageCarouselProps {
  images: ImageInfo[]
}

// Helper to check if a caption is just a filename (and should be hidden)
function isFilename(text: string): boolean {
  if (!text) return true
  // File extensions check
  if (/\.(png|jpg|jpeg|gif|webp|svg|PNG|JPG|JPEG|GIF|WEBP|SVG)$/i.test(text)) return true
  // UUIDs or hashes (long alphanumeric strings with dashes/underscores)
  if (/^[a-f0-9-]{12,}$/i.test(text)) return true
  // Common automated export naming structures
  if (/^[a-zA-Z0-9_-]+$/i.test(text) && (text.includes('-') || text.includes('_')) && text.length > 10) return true
  return false
}

export function ArticleImageCarousel({ images }: ArticleImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Navigation for mobile carousel
  const scrollToIndex = useCallback((idx: number) => {
    const container = containerRef.current
    if (container) {
      const itemWidth = container.offsetWidth
      container.scrollTo({
        left: idx * itemWidth,
        behavior: 'smooth'
      })
      setCurrentIndex(idx)
    }
  }, [])

  const handlePrev = useCallback(() => {
    const nextIdx = currentIndex === 0 ? images.length - 1 : currentIndex - 1
    scrollToIndex(nextIdx)
  }, [currentIndex, images.length, scrollToIndex])

  const handleNext = useCallback(() => {
    const nextIdx = currentIndex === images.length - 1 ? 0 : currentIndex + 1
    scrollToIndex(nextIdx)
  }, [currentIndex, images.length, scrollToIndex])

  // Track scrolling on mobile to sync dots
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const scrollLeft = container.scrollLeft
    const width = container.offsetWidth
    if (width > 0) {
      const idx = Math.round(scrollLeft / width)
      if (idx !== currentIndex && idx >= 0 && idx < images.length) {
        setCurrentIndex(idx)
      }
    }
  }

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') {
          setIsLightboxOpen(false)
        } else if (e.key === 'ArrowRight') {
          setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
        } else if (e.key === 'ArrowLeft') {
          setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, images.length])

  // Scroll lock when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isLightboxOpen])

  if (!images || images.length === 0) return null

  const activeImage = images[currentIndex]

  // Filter out filename captions
  const displayCaption = activeImage.alt && !isFilename(activeImage.alt) ? activeImage.alt : null

  return (
    <div className='article-gallery-wrapper'>
      {/* 1. DESKTOP GRID (visible on screen >= 768px) */}
      <div className='article-gallery-grid' role='region' aria-label='Galeria zdjęć'>
        {images.map((img, idx) => (
          <div
            key={idx}
            className='article-gallery-grid__item'
            onClick={() => {
              setCurrentIndex(idx)
              setIsLightboxOpen(true)
            }}
            title='Kliknij, aby powiększyć'
          >
            <div className='article-gallery-grid__image-wrapper'>
              <img
                src={img.src}
                alt={img.alt || 'Zdjęcie w galerii'}
                className='article-gallery-grid__image'
                draggable={false}
              />
              <div className='article-gallery-grid__zoom-badge'>
                <svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                  <circle cx='11' cy='11' r='8'></circle>
                  <line x1='21' y1='21' x2='16.65' y2='16.65'></line>
                  <line x1='11' y1='8' x2='11' y2='14'></line>
                  <line x1='8' y1='11' x2='14' y2='11'></line>
                </svg>
                <span>Powiększ</span>
              </div>
            </div>
            {img.alt && !isFilename(img.alt) && (
              <p className='article-gallery-grid__caption'>{img.alt}</p>
            )}
          </div>
        ))}
      </div>

      {/* 2. MOBILE CAROUSEL (visible on screen < 768px) */}
      <div className='article-gallery-carousel' role='region' aria-label='Galeria zdjęć (karuzela)'>
        <div className='article-carousel-container'>
          <div 
            ref={containerRef}
            className='article-carousel'
            onScroll={handleScroll}
          >
            {images.map((img, idx) => (
              <div 
                key={idx}
                className='article-carousel__slide'
                onClick={() => {
                  setCurrentIndex(idx)
                  setIsLightboxOpen(true)
                }}
                title='Kliknij, aby powiększyć'
              >
                <div className='article-carousel__image-wrapper'>
                  <img
                    src={img.src}
                    alt={img.alt || 'Zdjęcie w galerii'}
                    className='article-carousel__image'
                    draggable={false}
                  />
                  <div className='article-carousel__zoom-badge'>
                    <svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                      <circle cx='11' cy='11' r='8'></circle>
                      <line x1='21' y1='21' x2='16.65' y2='16.65'></line>
                      <line x1='11' y1='8' x2='11' y2='14'></line>
                      <line x1='8' y1='11' x2='14' y2='11'></line>
                    </svg>
                    <span>Powiększ</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className='article-carousel__nav-btn article-carousel__nav-btn--prev'
                aria-label='Poprzednie zdjęcie'
                type='button'
              >
                <svg viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                  <polyline points='15 18 9 12 15 6'></polyline>
                </svg>
              </button>
              <button
                onClick={handleNext}
                className='article-carousel__nav-btn article-carousel__nav-btn--next'
                aria-label='Następne zdjęcie'
                type='button'
              >
                <svg viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                  <polyline points='9 18 15 12 9 6'></polyline>
                </svg>
              </button>
            </>
          )}
        </div>

        <div className='article-carousel__footer'>
          {displayCaption && (
            <p className='article-carousel__caption'>{displayCaption}</p>
          )}
          {images.length > 1 && (
            <div className='article-carousel__indicators'>
              <span className='article-carousel__counter'>
                {currentIndex + 1} / {images.length}
              </span>
              <div className='article-carousel__dots'>
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToIndex(idx)}
                    className={`article-carousel__dot ${idx === currentIndex ? 'article-carousel__dot--active' : ''}`}
                    aria-label={`Przejdź do zdjęcia ${idx + 1}`}
                    type='button'
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. LIGHTBOX MODAL (shared fullscreen overlay) */}
      {isLightboxOpen && (
        <div 
          className='article-lightbox' 
          role='dialog' 
          aria-modal='true'
          aria-label='Powiększone zdjęcie'
        >
          <div className='article-lightbox__scrim' onClick={() => setIsLightboxOpen(false)} />

          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className='article-lightbox__close-btn'
            aria-label='Zamknij podgląd'
            type='button'
          >
            <svg viewBox='0 0 24 24' width='28' height='28' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <line x1='18' y1='6' x2='6' y2='18'></line>
              <line x1='6' y1='6' x2='18' y2='18'></line>
            </svg>
          </button>

          {/* Lightbox Content Area */}
          <div className='article-lightbox__content'>
            <img
              key={currentIndex}
              src={activeImage.src}
              alt={activeImage.alt || 'Powiększone zdjęcie'}
              className='article-lightbox__image'
              draggable={false}
            />


            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  className='article-lightbox__nav-btn article-lightbox__nav-btn--prev'
                  aria-label='Poprzednie zdjęcie'
                  type='button'
                >
                  <svg viewBox='0 0 24 24' width='32' height='32' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <polyline points='15 18 9 12 15 6'></polyline>
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  className='article-lightbox__nav-btn article-lightbox__nav-btn--next'
                  aria-label='Następne zdjęcie'
                  type='button'
                >
                  <svg viewBox='0 0 24 24' width='32' height='32' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <polyline points='9 18 15 12 9 6'></polyline>
                  </svg>
                </button>
              </>
            )}

            {(displayCaption || images.length > 1) && (
              <div className='article-lightbox__caption-panel'>
                {displayCaption && <p className='article-lightbox__caption'>{displayCaption}</p>}
                {images.length > 1 && (
                  <span className='article-lightbox__counter'>
                    {currentIndex + 1} / {images.length}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
