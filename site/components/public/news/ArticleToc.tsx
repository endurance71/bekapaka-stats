'use client'

import { useEffect, useState } from 'react'

export type ArticleTocItem = { id: string; title: string }

/** Spis treści w szynie artykułu (≥ 1280 px): aktywna sekcja i licznik „3 / 11”. */
export function ArticleToc({ items }: { items: ArticleTocItem[] }) {
  const [active, setActive] = useState(-1)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      // Sekcja jest aktywna, gdy jej nagłówek minie górną ~⅓ ekranu.
      const offset = window.innerHeight * 0.35
      let current = -1
      items.forEach((item, index) => {
        const target = document.getElementById(item.id)
        if (target && target.getBoundingClientRect().top <= offset) current = index
      })
      setActive(current)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [items])

  return (
    <nav className="toc-rail" aria-label="Spis treści">
      <p className="toc-rail__head">
        <span>W tym artykule</span>
        <span className="toc-rail__count" aria-hidden="true">
          {Math.max(active + 1, 1)} / {items.length}
        </span>
      </p>
      <ol role="list">
        {items.map((item, index) => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={index === active ? 'location' : undefined}>
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
