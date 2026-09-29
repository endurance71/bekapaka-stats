import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ArticleMarkdown } from '../components/public/shared/ArticleMarkdown'
import { NewsAttachments } from '../components/public/shared/NewsAttachments'
import { EditorialDetailTemplate } from '../components/public/templates/EditorialDetailTemplate'

describe('Article Editorial System', () => {
  describe('EditorialDetailTemplate', () => {
    it('renders unified editorial shell with navigation, header, lead and content', () => {
      const html = renderToStaticMarkup(
        <EditorialDetailTemplate
          sectionLabel='Aktualności'
          title='Politechnika Koszalińska z Pucharem'
          meta='26 września 2026, 18:00'
          lead='To był emocjonujący turniej w Bobolicach.'
          parentHref='/aktualnosci'
          parentLabel='Wróć do aktualności'
          content={<div className='mock-content'>Treść</div>}
        />
      )

      expect(html).toContain('class="article-detail"')
      expect(html).toContain('class="article-detail__shell"')
      expect(html).toContain('href="/aktualnosci"')
      expect(html).toContain('Wróć do aktualności')
      expect(html).toContain('class="article-detail__eyebrow"')
      expect(html).toContain('Aktualności')
      expect(html).toContain('class="article-detail__title"')
      expect(html).toContain('Politechnika Koszalińska z Pucharem')
      expect(html).toContain('class="article-detail__meta"')
      expect(html).toContain('26 września 2026, 18:00')
      expect(html).toContain('class="article-detail__lead"')
      expect(html).toContain('To był emocjonujący turniej w Bobolicach.')
      expect(html).toContain('class="mock-content"')
    })

    it('renders gracefully without optional lead and meta', () => {
      const html = renderToStaticMarkup(
        <EditorialDetailTemplate
          sectionLabel='Aktualności'
          title='Krótki news'
          parentHref='/aktualnosci'
          content={<p>Krótka treść</p>}
        />
      )

      expect(html).toContain('Krótki news')
      expect(html).not.toContain('class="article-detail__lead"')
      expect(html).not.toContain('class="article-detail__meta"')
    })
  })

  describe('ArticleMarkdown semantic hierarchy', () => {
    it('renders H2 and H3 with correct semantic classes and distinction', () => {
      const markdown = `## Główna sekcja turnieju\n\nTekst pod sekcją.\n\n### Podsekcja meczowa\n\nSzczegóły meczu.`
      const html = renderToStaticMarkup(<ArticleMarkdown content={markdown} />)

      expect(html).toContain('class="article-markdown__h2"')
      expect(html).toContain('Główna sekcja turnieju')
      expect(html).toContain('class="article-markdown__h3"')
      expect(html).toContain('Podsekcja meczowa')
      expect(html).toContain('class="article-markdown__p"')
    })

    it('renders strong elements with semantic strong class (not inline colored)', () => {
      const markdown = `To jest **Politechnika Koszalińska** oraz **18 punktów** w meczu.`
      const html = renderToStaticMarkup(<ArticleMarkdown content={markdown} />)

      expect(html).toContain('class="article-markdown__strong"')
      expect(html).toContain('Politechnika Koszalińska')
      expect(html).toContain('18 punktów')
      expect(html).not.toContain('style="color:')
    })

    it('renders unordered and ordered lists with correct classes', () => {
      const markdown = `- Drużyna A\n- Drużyna B\n\n1. Pierwsze miejsce\n2. Drugie miejsce`
      const html = renderToStaticMarkup(<ArticleMarkdown content={markdown} />)

      expect(html).toContain('class="article-markdown__ul"')
      expect(html).toContain('class="article-markdown__ol"')
      expect(html).toContain('class="article-markdown__li"')
      expect(html).toContain('Drużyna A')
      expect(html).toContain('Pierwsze miejsce')
    })

    it('renders markdown images with interactive carousel and caption', () => {
      const markdown = `Oto zdjęcie z turnieju:\n\n![Puchar Burmistrza Bobolic](https://cms.bekapaka.pl/uploads/cup.jpg)`
      const html = renderToStaticMarkup(<ArticleMarkdown content={markdown} />)

      expect(html).toContain('class="article-gallery"')
      expect(html).toContain('class="article-gallery__image"')
      expect(html).toContain('Puchar Burmistrza Bobolic')
    })

    it('renders blockquote for editorial callouts', () => {
      const markdown = `> Ważny cytat trenera po meczu.`
      const html = renderToStaticMarkup(<ArticleMarkdown content={markdown} />)

      expect(html).toContain('class="article-markdown__blockquote"')
      expect(html).toContain('Ważny cytat trenera po meczu.')
    })

    it('renders subtle horizontal rule separator', () => {
      const markdown = `Sekcja przed\n\n---\n\nSekcja po`
      const html = renderToStaticMarkup(<ArticleMarkdown content={markdown} />)

      expect(html).toContain('class="article-markdown__hr"')
    })
  })

  describe('Regression coverage for all 6 article archetypes (A-F)', () => {
    it('Case A: Short announcement without lead', () => {
      const html = renderToStaticMarkup(
        <EditorialDetailTemplate
          sectionLabel='Aktualności'
          title='II Turniej Koszykówki'
          parentHref='/aktualnosci'
          content={
            <ArticleMarkdown content='**WITAJCIE!**\n\nJuż dziś zapraszamy na turniej koszykówki **3×3** na rynku miejskim w Bobolicach.' />
          }
        />
      )
      expect(html).toContain('class="article-detail__title"')
      expect(html).toContain('II Turniej Koszykówki')
      expect(html).toContain('class="article-markdown__strong"')
      expect(html).not.toContain('class="article-detail__lead"')
    })

    it('Case B: Standard post with lead', () => {
      const html = renderToStaticMarkup(
        <EditorialDetailTemplate
          sectionLabel='Aktualności'
          title='Jesteśmy online — BeKaPaKa Bobolice ma swoją stronę'
          meta='1 czerwca 2026'
          lead='Nasza strona bekapaka.pl jest już online.'
          parentHref='/aktualnosci'
          content={
            <ArticleMarkdown content='## Nowa strona BeKaPaKa — zapraszamy!\n\nPrzez lata graliśmy **dla frajdy**.' />
          }
        />
      )
      expect(html).toContain('class="article-detail__lead"')
      expect(html).toContain('Nasza strona bekapaka.pl jest już online.')
      expect(html).toContain('class="article-markdown__h2"')
    })

    it('Case C: Post with H2 and H3 subsections', () => {
      const content = `## Kogo szukamy?

Szukamy graczy.

### Rozgrywający i środkowy

W szczególności pozycje 1 i 5.`

      const html = renderToStaticMarkup(
        <EditorialDetailTemplate
          sectionLabel='Aktualności'
          title='Szukasz drużyny na nowy sezon?'
          lead='BKPK BeKaPaKa Bobolice ogłasza nabór!'
          parentHref='/aktualnosci'
          content={<ArticleMarkdown content={content} />}
        />
      )
      expect(html).toContain('class="article-markdown__h2"')
      expect(html).toContain('class="article-markdown__h3"')
      expect(html).toContain('Rozgrywający i środkowy')
    })

    it('Case D: Post with lists and schedules', () => {
      const content = `## Najważniejsze godziny

- **9:30–10:15** – rozgrzewka
- **10:15–10:30** – oficjalne otwarcie

1. Pierwsze miejsce
2. Drugie miejsce`

      const html = renderToStaticMarkup(
        <EditorialDetailTemplate
          sectionLabel='Aktualności'
          title='Harmonogram II Turnieju'
          parentHref='/aktualnosci'
          content={<ArticleMarkdown content={content} />}
        />
      )
      expect(html).toContain('class="article-markdown__ul"')
      expect(html).toContain('class="article-markdown__ol"')
      expect(html).toContain('rozgrzewka')
    })

    it('Case E: Post with gallery carousel', () => {
      const content = `## Galeria z turnieju

![Zdjecie 1](https://cms.bekapaka.pl/img1.jpg)
![Zdjecie 2](https://cms.bekapaka.pl/img2.jpg)`

      const html = renderToStaticMarkup(
        <EditorialDetailTemplate
          sectionLabel='Aktualności'
          title='II Turniej Koszykówki Społecznika'
          parentHref='/aktualnosci'
          content={<ArticleMarkdown content={content} />}
        />
      )
      expect(html).toContain('class="article-gallery"')
      expect(html).toContain('class="article-gallery__arrow')
    })

    it('Case F: Long tournament reportage (III Turniej)', () => {
      const content = `Osiem drużyn, 16 spotkań i niemal cały dzień koszykówki w hali CESiR.

## Od symbolicznej wstęgi do pierwszego podrzutu

Turniej od rana zgromadził w hali zawodników.

## Czas na mecze o miejsca

### MAXBAU wygrywa mecz o 7. miejsce

MAXBAU Okna DAKO PSP 40:26 GRUBIK TEAM

### Brąz dla LKS Bonin Bio-Energetyka

TKKF Koszalin 15:20 LKS Bonin Bio-Energetyka

## Klasyfikacja końcowa

1. **Politechnika Koszalińska**
2. Alfa Trans
3. LKS Bonin Bio-Energetyka`

      const html = renderToStaticMarkup(
        <EditorialDetailTemplate
          sectionLabel='Aktualności'
          title='Politechnika Koszalińska z Pucharem Burmistrza Bobolic. Za nami III edycja turnieju'
          meta='26 września 2026'
          lead='Politechnika Koszalińska wygrała III Turniej Koszykówki o Puchar Burmistrza Bobolic. 8 drużyn, 16 meczów i pełna klasyfikacja.'
          parentHref='/aktualnosci'
          content={<ArticleMarkdown content={content} />}
        />
      )
      expect(html).toContain('Politechnika Koszalińska z Pucharem Burmistrza Bobolic')
      expect(html).toContain('class="article-detail__lead"')
      expect(html).toContain('Od symbolicznej wstęgi do pierwszego podrzutu')
      expect(html).toContain('MAXBAU wygrywa mecz o 7. miejsce')
      expect(html).toContain('Brąz dla LKS Bonin Bio-Energetyka')
      expect(html).toContain('class="article-markdown__ol"')
      expect(html).toContain('Alfa Trans')
    })
  })

  describe('NewsAttachments UX Formatter', () => {
    it('formats Word docx with human-readable type and size', () => {
      const attachments = [
        {
          id: '1',
          name: 'HARMONOGRAM GODZINOWY-1.docx',
          url: '/uploads/harmonogram.docx',
          mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ext: '.docx',
          size: 20.9
        },
        {
          id: '2',
          name: 'Regulamin Turniej Parafiada 2026 BKPK-3.doc',
          url: '/uploads/regulamin.doc',
          mime: 'application/msword',
          ext: '.doc',
          size: 888.83
        }
      ]

      const html = renderToStaticMarkup(<NewsAttachments items={attachments} />)
      expect(html).toContain('DOCX · Dokument Word · 21 KB')
      expect(html).toContain('DOC · Dokument Word · 889 KB')
      expect(html).not.toContain('application/vnd.openxmlformats')
      expect(html).not.toContain('application/msword')
    })

    it('formats PDF and spreadsheet attachments correctly', () => {
      const attachments = [
        {
          id: '3',
          name: 'Zestawienie-wynikow.xlsx',
          url: '/uploads/wyniki.xlsx',
          ext: '.xlsx',
          size: 1500
        },
        {
          id: '4',
          name: 'Regulamin.pdf',
          url: '/uploads/regulamin.pdf',
          ext: '.pdf'
        }
      ]

      const html = renderToStaticMarkup(<NewsAttachments items={attachments} />)
      expect(html).toContain('XLSX · Arkusz Excel · 1.5 MB')
      expect(html).toContain('PDF')
    })
  })

  describe('Semantic Sports Blocks & Accessibility Enhancements', () => {
    it('automatically compiles hourly schedule lists into ScheduleTimeline with breakout container', () => {
      const markdown = `## Najważniejsze godziny
- **9:30–10:15** – rozgrzewka
- **10:15–10:30** – oficjalne otwarcie turnieju
- **10:30** – start fazy grupowej
- **16:00** – finał
- **16:30–16:45** – rozdanie nagród na Placu Parafialnym`

      const html = renderToStaticMarkup(<ArticleMarkdown content={markdown} />)

      expect(html).toContain('class="schedule-timeline"')
      expect(html).toContain('class="article-markdown__breakout"')
      expect(html).toContain('9:30–10:15')
      expect(html).toContain('rozgrzewka')
      expect(html).toContain('16:00')
      expect(html).toContain('finał')
      expect(html).toContain('schedule-timeline__item--highlight')
    })

    it('automatically compiles tournament group lists into TournamentGroupsBoard', () => {
      const markdown = `## Podział na grupy
### Grupa A
- Pominięci w drafcie
- BeKaPaKa Rozpruwacze
- Maxbau Okna Dako PSP

### Grupa B
- Polibasket Politechnika Koszalińska
- Młode Wilki
- BeKaPaKa Grupa Inwalidzka`

      const html = renderToStaticMarkup(<ArticleMarkdown content={markdown} />)

      expect(html).toContain('class="tournament-groups"')
      expect(html).toContain('Grupa A')
      expect(html).toContain('Grupa B')
      expect(html).toContain('Pominięci w drafcie')
      expect(html).toContain('Polibasket Politechnika Koszalińska')
      expect(html).toContain('tournament-groups__team-item--bkpk')
      expect(html).toContain('BKPK')
    })

    it('sanitizes camera UUID filenames in gallery images with contextual descriptive ALT text', () => {
      const markdown = `![C689418D-9A69-45B4-918D-7E3120EBA873.PNG](https://cms.bekapaka.pl/img1.png)\n![60664F9E-EF30-4247-9B96-9955516DEF27.PNG](https://cms.bekapaka.pl/img2.png)`

      const html = renderToStaticMarkup(
        <ArticleMarkdown content={markdown} contextTitle='Harmonogram II Turnieju' />
      )

      expect(html).not.toContain('C689418D-9A69-45B4-918D-7E3120EBA873.PNG')
      expect(html).not.toContain('60664F9E-EF30-4247-9B96-9955516DEF27.PNG')
      expect(html).toContain('Harmonogram II Turnieju – Zdjęcie 1')
      expect(html).toContain('Harmonogram II Turnieju – Zdjęcie 2')
    })

    it('strictly guarantees header element order: Eyebrow -> Title -> Lead -> Meta', () => {
      const html = renderToStaticMarkup(
        <EditorialDetailTemplate
          sectionLabel='TURNIEJ'
          title='II Turniej Koszykówki'
          lead='To jest wyrazisty lead redakcyjny'
          meta='2 lipca 2026 · 3 min czytania'
          parentHref='/aktualnosci'
          content={<p>Treść</p>}
        />
      )

      const eyebrowPos = html.indexOf('article-detail__eyebrow')
      const titlePos = html.indexOf('article-detail__title')
      const leadPos = html.indexOf('article-detail__lead')
      const metaPos = html.indexOf('article-detail__meta')

      expect(eyebrowPos).toBeGreaterThan(-1)
      expect(titlePos).toBeGreaterThan(eyebrowPos)
      expect(leadPos).toBeGreaterThan(titlePos)
      expect(metaPos).toBeGreaterThan(leadPos)
    })
  })
})


