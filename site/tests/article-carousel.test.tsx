import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ArticleImageCarousel } from '../components/public/shared/ArticleImageCarousel'
const images = (count: number) => Array.from({ length: count }, (_, index) => ({ src: `https://cms.bekapaka.pl/uploads/photo_${index}.jpg`, alt: `Opis ${index}`, author: 'Fotograf', caption: 'Mecz' }))
describe('Gallery grid', () => {
 it.each([1,2,8,20])('renders %i individual, keyboard accessible lightbox triggers', count => {
  const html=renderToStaticMarkup(<ArticleImageCarousel images={images(count)}/>)
  expect(html.split('aria-label="Powiększ zdjęcie:').length-1).toBe(Math.min(count, 9))
  expect(html).toContain('article-gallery__grid')
  expect(html).not.toContain('article-gallery__track')
  expect(html).toContain('Fot. Fotograf')
 })
 it('shows 9 photos first and offers the rest behind a button', () => {
  const html=renderToStaticMarkup(<ArticleImageCarousel images={images(20)}/>)
  expect(html).toContain('Pokaż wszystkie zdjęcia (20)')
  expect(renderToStaticMarkup(<ArticleImageCarousel images={images(9)}/>)).not.toContain('Pokaż wszystkie zdjęcia')
 })
 it('does not render an empty gallery', () => expect(renderToStaticMarkup(<ArticleImageCarousel images={[]}/>)).toBe(''))
})
