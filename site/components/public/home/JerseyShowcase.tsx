'use client'

import { useState } from 'react'
import Image from 'next/image'

interface JerseyItem {
  id: string
  name: string
  kit: 'A' | 'B'
  variantLabel: string
  colorDescription: string
  frontSrc: string
  backSrc: string
  imageWidth: number
  imageHeight: number
  accentColor: string
}

const JERSEYS: JerseyItem[] = [
  {
    id: 'wariant-a',
    name: 'Wariant A',
    kit: 'A',
    variantLabel: 'Wariant A',
    colorDescription: '',
    frontSrc: '/brand/jerseys/stroj-a-przod-transparent-v1.png',
    backSrc: '/brand/jerseys/stroj-a-tyl-transparent-v1.png',
    imageWidth: 1086,
    imageHeight: 1448,
    accentColor: 'var(--c-red-500)'
  },
  {
    id: 'wariant-b',
    name: 'Wariant B',
    kit: 'B',
    variantLabel: 'Wariant B',
    colorDescription: '',
    frontSrc: '/brand/jerseys/stroj-b-przod-transparent-v1.png',
    backSrc: '/brand/jerseys/stroj-b-tyl-transparent-v1.png',
    imageWidth: 1024,
    imageHeight: 1536,
    accentColor: 'var(--c-orange-500)'
  }
]

export function JerseyShowcase() {
  const [activeSide, setActiveSide] = useState<Record<string, 'front' | 'back'>>({
    'wariant-a': 'front',
    'wariant-b': 'front'
  })

  const toggleSide = (id: string) => {
    setActiveSide((prev) => ({
      ...prev,
      [id]: prev[id] === 'front' ? 'back' : 'front'
    }))
  }

  return (
    <div className="jersey-grid" role="group" aria-label="Oficjalne stroje meczowe BeKaPaKa Bobolice">
      {JERSEYS.map((jersey) => {
        const side = activeSide[jersey.id] || 'front'
        const isBack = side === 'back'
        const currentSrc = isBack ? jersey.backSrc : jersey.frontSrc
        const altText = `${jersey.name} BeKaPaKa Bobolice (${isBack ? 'tył' : 'przód'})`

        return (
          <article
            key={jersey.id}
            className={`card jersey-card jersey-card--kit-${jersey.kit.toLowerCase()}`}
            style={{ '--card-accent': jersey.accentColor } as React.CSSProperties}
          >
            <div className="jersey-card__head">
              <h4 className="jersey-card__title card__title">{jersey.name}</h4>
              <button
                type="button"
                className="jersey-card__toggle-btn btn btn--secondary btn--sm"
                onClick={() => toggleSide(jersey.id)}
                aria-label={`Obróć strój: ${jersey.name} (obecnie ${isBack ? 'tył' : 'przód'})`}
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
                  <path d="M4 12a8 8 0 0 1 14.93-4M20 12a8 8 0 0 1-14.93 4" />
                  <path d="M20 4v4h-4M4 20v-4h4" />
                </svg>
                {isBack ? 'Przód' : 'Tył'}
              </button>
            </div>
            <div className="jersey-card__media">
              <button
                type="button"
                className="jersey-card__image-wrap"
                onClick={() => toggleSide(jersey.id)}
                aria-label={`Pokaż ${isBack ? 'przód' : 'tył'} stroju: ${jersey.name}`}
              >
                <Image
                  src={currentSrc}
                  alt={altText}
                  width={jersey.imageWidth}
                  height={jersey.imageHeight}
                  className="jersey-card__image"
                  sizes="(min-width: 1600px) 780px, (min-width: 768px) 50vw, 100vw"
                  loading="lazy"
                />
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
