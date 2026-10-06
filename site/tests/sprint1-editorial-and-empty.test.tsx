import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EditorialDetailTemplate } from '../components/public/templates/EditorialDetailTemplate'
import { EmptyState } from '../components/public/shared/EmptyState'
import { EditorialListingTemplate } from '../components/public/templates/EditorialListingTemplate'

describe('Sprint 1 - Editorial & Empty States (UI-05, UI-07, UI-10)', () => {
  it('EditorialDetailTemplate supports coverFit="contain" for posters (UI-05)', () => {
    const html = renderToStaticMarkup(
      <EditorialDetailTemplate
        sectionLabel="Turniej"
        title="III Turniej Bobolice"
        parentHref="/aktualnosci"
        cover={<img src="/poster.jpg" alt="Plakat" />}
        coverFit="contain"
        content={<p>Treść</p>}
      />
    )
    expect(html).toContain('class="art-cover art-cover--contain"')
  })

  it('EditorialDetailTemplate uses visually-hidden-focusable for accessible Tab navigation (UI-07)', () => {
    const html = renderToStaticMarkup(
      <EditorialDetailTemplate
        sectionLabel="Aktualności"
        title="Tytuł artykułu"
        parentHref="/aktualnosci"
        parentLabel="Wróć do listy artykułów"
        content={<p>Treść</p>}
      />
    )
    expect(html).toContain('class="article-detail__back-link visually-hidden-focusable"')
    expect(html).toContain('Wróć do listy artykułów')
  })

  it('EmptyState renders action element when provided (UI-10)', () => {
    const html = renderToStaticMarkup(
      <EmptyState
        title="Brak dokumentów"
        description="Dokumenty pojawią się wkrótce."
        action={<a href="/klub" className="button">Wróć do klubu</a>}
      />
    )
    expect(html).toContain('Brak dokumentów')
    expect(html).toContain('class="empty-state__action"')
    expect(html).toContain('href="/klub"')
    expect(html).toContain('Wróć do klubu')
  })

  it('EditorialListingTemplate passes emptyAction to EmptyState (UI-10)', () => {
    const html = renderToStaticMarkup(
      <EditorialListingTemplate
        title="Dokumenty klubowe"
        description="Regulaminy i formularze."
        hasItems={false}
        emptyTitle="Brak dokumentów"
        emptyDescription="Klub nie opublikował jeszcze dokumentów."
        emptyAction={<a href="/klub">Wróć do klubu</a>}
      >
        <ul><li>Item</li></ul>
      </EditorialListingTemplate>
    )
    expect(html).toContain('class="empty-state__action"')
    expect(html).toContain('href="/klub"')
    expect(html).toContain('Wróć do klubu')
  })
})
