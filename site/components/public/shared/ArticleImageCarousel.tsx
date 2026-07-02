'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface ImageInfo {
  src: string
  alt: string
}

interface ArticleImageCarouselProps {
  images: ImageInfo[]
}

export function ArticleImageCarousel({ images }: ArticleImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1))
  }, [images.length])

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1))
  }, [images.length])

  // Keyboard navigation for Lightbox and Carousel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') {
          setIsLightboxOpen(false)
        } else if (e.key === 'ArrowRight') {
          handleNext()
        } else if (e.key === 'ArrowLeft') {
          handlePrev()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, handleNext, handlePrev])

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

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || e.changedTouches.length !== 1) return
    const touchEndX = e.changedTouches[0].clientX
    const diffX = touchStartX - touchEndX

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
    setTouchStartX(null)
  }

  if (!images || images.length === 0) return null

  const activeImage = images[currentIndex]

  return (
    <div className='article-carousel-wrapper' role='region' aria-label='Galeria zdjęć'>
      {/* Main Slider Container */}
      <div 
        className='article-carousel'
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className='article-carousel__image-wrapper'
          onClick={() => setIsLightboxOpen(true)}
          title='Kliknij, aby powiększyć'
        >
          <img
            src={activeImage.src}
            alt={activeImage.alt || 'Zdjęcie w galerii'}
            className='article-carousel__image'
            draggable={false}
          />
          <div className='article-carousel__zoom-badge'>
            <svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <circle cx='11' cy='11' r='8'></circle>
              <line x1='21' y1='21' x2='16.65' y2='16.65'></line>
              <line x1='11' y1='8' x2='11' y2='14'></line>
              <line x1='8' y1='11' x2='14' y2='11'></line>
            </svg>
            <span>Powiększ</span>
          </div>
        </div>

        {/* Carousel controls (if > 1 image) */}
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

      {/* Caption & Info Panel */}
      <div className='article-carousel__footer'>
        {activeImage.alt && (
          <p className='article-carousel__caption'>{activeImage.alt}</p>
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
                  onClick={() => setCurrentIndex(idx)}
                  className={`article-carousel__dot ${idx === currentIndex ? 'article-carousel__dot--active' : ''}`}
                  aria-label={`Przejdź do zdjęcia ${idx + 1}`}
                  type='button'
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className='article-lightbox' 
          role='dialog' 
          aria-modal='true'
          aria-label='Powiększone zdjęcie'
        >
          {/* Scrim Background */}
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
          <div 
            className='article-lightbox__content'
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={activeImage.src}
              alt={activeImage.alt || 'Powiększone zdjęcie'}
              className='article-lightbox__image'
              draggable={false}
            />

            {/* Lightbox Controls (if > 1 image) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className='article-lightbox__nav-btn article-lightbox__nav-btn--prev'
                  aria-label='Poprzednie zdjęcie'
                  type='button'
                >
                  <svg viewBox='0 0 24 24' width='32' height='32' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <polyline points='15 18 9 12 15 6'></polyline>
                  </svg>
                </button>
                <button
                  onClick={handleNext}
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

            {/* Lightbox Caption */}
            {activeImage.alt && (
              <div className='article-lightbox__caption-panel'>
                <p className='article-lightbox__caption'>{activeImage.alt}</p>
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
