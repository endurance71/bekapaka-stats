import { approvedMedia, type MediaRecord } from '../../../lib/data/media-review'
import ReactMarkdown from 'react-markdown'
import { ArticleImageCarousel } from './ArticleImageCarousel'
import { FallbackImage } from './FallbackImage'
import { ScheduleTimeline, type ScheduleItem } from '../editorial/ScheduleTimeline'
import { TournamentGroupsBoard, type TournamentGroup } from '../editorial/TournamentGroupsBoard'
import { getStrapiMediaProps } from '../../../lib/data/media'
import { isCameraOrUuidFilename, resolveImageAlt } from '../../../lib/data/utils'
import { bindPolishOrphans, bindTrailingPolishOrphan } from '../../../lib/typography'

interface MarkdownTextNode {
  type: string
  value?: string
  children?: MarkdownTextNode[]
}

function startsWithWord(node: MarkdownTextNode): boolean {
  if (typeof node.value === 'string') return /^[\p{L}\p{N}]/u.test(node.value)
  return node.children?.length ? startsWithWord(node.children[0]) : false
}

function remarkBindPolishOrphans() {
  return (tree: MarkdownTextNode) => {
    function visit(node: MarkdownTextNode) {
      if (node.type === 'text' && typeof node.value === 'string') {
        node.value = bindPolishOrphans(node.value)
      }

      node.children?.forEach((child, index, siblings) => {
        visit(child)
        if (child.type === 'text' && typeof child.value === 'string' && startsWithWord(siblings[index + 1] ?? { type: 'break' })) {
          child.value = bindTrailingPolishOrphan(child.value)
        }
      })
    }

    visit(tree)
  }
}

const isListLine = (line: string) => /^([-*•]|\d+\.)\s+/.test(line)
const isHeadingLine = (line: string) => /^#{1,6}\s+/.test(line)
const isHorizontalRule = (line: string) => /^[-*_]{3,}$/.test(line)

interface ImageInfo {
  src: string
  alt: string
}

interface MatchScore {
  homeTeam: string
  homeScore: string
  awayTeam: string
  awayScore: string
}

type ContentBlock =
  | { type: 'markdown'; content: string }
  | { type: 'gallery'; images: ImageInfo[] }
  | { type: 'schedule'; items: ScheduleItem[]; title?: string }
  | { type: 'tournament_groups'; groups: TournamentGroup[]; title?: string }

const scheduleLineRegex = /^[-*•]\s+\*\*?(\d{1,2}[:.]\d{2}(?:\s*[-–—]\s*\d{1,2}[:.]\d{2})?)\*\*?\s*[-–—:]\s*(.+)$/

const editorialAcronyms = ['MVP', 'KALK', 'BKPK', 'CESiR']

function getChildrenText(children: React.ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(getChildrenText).join('')
  return ''
}

function sentenceCaseHeading(children: React.ReactNode): React.ReactNode {
  const text = getChildrenText(children).trim()
  if (!text || text !== text.toLocaleUpperCase('pl-PL')) return children

  let result = text.toLocaleLowerCase('pl-PL')
  result = `${result.charAt(0).toLocaleUpperCase('pl-PL')}${result.slice(1)}`
  editorialAcronyms.forEach((acronym) => {
    result = result.replace(new RegExp(`\\b${acronym.toLocaleLowerCase('pl-PL')}\\b`, 'gi'), acronym)
  })
  return result
}

function parseSummary(text: string): { title: string; items: string[] } | null {
  const match = text.trim().match(/^(.{2,80}w liczbach):\s*(.+)$/i)
  if (!match) return null
  const items = match[2].split('·').map((item) => item.trim()).filter(Boolean)
  return items.length >= 2 ? { title: match[1], items } : null
}

/** Turn a standalone `Team A 40:26 Team B` line into a scannable score board. */
function parseMatchScore(text: string): MatchScore | null {
  const normalized = text.trim()
  const scoreMatches = normalized.match(/\d{1,2}\s*:\s*\d{1,2}/g)
  if (scoreMatches?.length !== 1 || /[,.!?]/.test(normalized)) return null

  const match = normalized.match(/^(.+?)\s+(\d{1,2})\s*:\s*(\d{1,2})\s+(.+)$/)
  if (!match) return null

  const narrativeWords = /\b(w|z|i|na|do|od|po|który|która|wygrał|wygrała|pokonał|pokonała|zwycięstwem|zakończył|zakończyła|zapewniła|zdobył|zdobyła|miejsce|meczu|spotkaniu|grupie)\b/i
  if (narrativeWords.test(match[1]) || narrativeWords.test(match[4])) return null

  return {
    homeTeam: match[1].trim(),
    homeScore: match[2],
    awayTeam: match[4].trim(),
    awayScore: match[3]
  }
}

function parseScheduleLines(lines: string[]): { items: ScheduleItem[]; raw: string[] } | null {
  const items: ScheduleItem[] = []
  const raw: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const match = trimmed.match(scheduleLineRegex)
    if (match) {
      items.push({
        time: match[1].trim(),
        description: match[2].trim()
      })
      raw.push(line)
    } else {
      break
    }
  }

  if (items.length >= 3) {
    return { items, raw }
  }
  return null
}

function parseScheduleBlocks(text: string): ContentBlock[] {
  const lines = text.split('\n')
  const result: ContentBlock[] = []
  let buffer: string[] = []

  const flushBuffer = () => {
    if (buffer.length > 0) {
      const content = buffer.join('\n').trim()
      if (content) result.push({ type: 'markdown', content })
      buffer = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (scheduleLineRegex.test(trimmed)) {
      const candidateLines = lines.slice(i)
      const parsed = parseScheduleLines(candidateLines)

      if (parsed) {
        flushBuffer()
        result.push({
          type: 'schedule',
          items: parsed.items
        })
        i += parsed.items.length - 1
        continue
      }
    }

    buffer.push(line)
  }

  flushBuffer()
  return result
}

/**
 * Scan content and extract semantic blocks: galleries, tournament groups, schedules, and prose markdown.
 */
function extractSemanticBlocks(text: string, contextTitle: string): ContentBlock[] {
  // 1. Find consecutive markdown images
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g
  const matches: { start: number; end: number; alt: string; src: string }[] = []
  let m: RegExpExecArray | null

  while ((m = imageRegex.exec(text)) !== null) {
    matches.push({
      start: m.index,
      end: imageRegex.lastIndex,
      alt: m[1],
      src: m[2]
    })
  }

  let segments: ({ type: 'text'; content: string } | { type: 'gallery'; images: ImageInfo[] })[]

  if (matches.length === 0) {
    segments = [{ type: 'text', content: text }]
  } else {
    const groups: { alt: string; src: string; start: number; end: number }[][] = []
    let currentGroup: { alt: string; src: string; start: number; end: number }[] = []

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      if (currentGroup.length === 0) {
        currentGroup.push(match)
      } else {
        const prev = currentGroup[currentGroup.length - 1]
        const between = text.substring(prev.end, match.start)
        if (/^\s*$/.test(between)) {
          currentGroup.push(match)
        } else {
          groups.push([...currentGroup])
          currentGroup = [match]
        }
      }
    }
    if (currentGroup.length > 0) {
      groups.push([...currentGroup])
    }

    segments = []
    let lastIndex = 0

    for (let g = 0; g < groups.length; g++) {
      const group = groups[g]
      const groupStart = group[0].start
      const groupEnd = group[group.length - 1].end

      if (groupStart > lastIndex) {
        segments.push({
          type: 'text',
          content: text.substring(lastIndex, groupStart)
        })
      }

      segments.push({
        type: 'gallery',
        images: group.map((img, idx) => ({
          src: img.src,
          alt: resolveImageAlt(img.alt, contextTitle, idx)
        }))
      })

      lastIndex = groupEnd
    }

    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex)
      })
    }
  }

  // 2. Parse tournament groups and schedules in text segments
  const blocks: ContentBlock[] = []

  for (const seg of segments) {
    if (seg.type === 'gallery') {
      blocks.push(seg)
      continue
    }

    let remaining = seg.content

    // Detect Tournament Groups: 2 or more consecutive ### Grupa ...
    const allGroupsMatch = remaining.match(/(?:###\s+Grupa\s+[A-Za-z0-9]+\s*\n(?:[-*•]\s+[^\n]+\n?)+[\s\n]*){2,}/i)

    if (allGroupsMatch) {
      const matchIndex = remaining.indexOf(allGroupsMatch[0])
      const matchLength = allGroupsMatch[0].length
      const before = remaining.substring(0, matchIndex)
      const matchedText = allGroupsMatch[0]
      const after = remaining.substring(matchIndex + matchLength)

      if (before.trim()) {
        blocks.push(...parseScheduleBlocks(before))
      }

      const singleGroupRegex = /###\s+(Grupa\s+[A-Za-z0-9]+)\s*\n((?:[-*•]\s+[^\n]+\n?)+)/gi
      const groups: TournamentGroup[] = []
      let gm: RegExpExecArray | null

      while ((gm = singleGroupRegex.exec(matchedText)) !== null) {
        const name = gm[1].trim()
        const teams = gm[2]
          .trim()
          .split('\n')
          .map((l) => l.replace(/^[-*•]\s+/, '').trim())
          .filter(Boolean)
        groups.push({ name, teams })
      }

      if (groups.length >= 2) {
        blocks.push({ type: 'tournament_groups', groups })
      } else {
        blocks.push({ type: 'markdown', content: matchedText })
      }

      remaining = after
    }

    if (remaining.trim()) {
      blocks.push(...parseScheduleBlocks(remaining))
    }
  }

  return blocks
}

/**
 * Strapi editors often use single line breaks; merge prose lines so **bold** parses correctly,
 * while keeping lists and headings grouped cleanly.
 */
function normalizeNewsMarkdown(content: string): string {
  const sanitized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = sanitized.split('\n')
  const blocks: string[] = []
  let buffer = ''
  let inList = false

  const flush = () => {
    if (buffer.trim()) blocks.push(buffer.trim())
    buffer = ''
    inList = false
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flush()
      continue
    }
    if (isHeadingLine(trimmed) || isHorizontalRule(trimmed)) {
      flush()
      blocks.push(trimmed)
      continue
    }
    if (isListLine(trimmed)) {
      if (inList) {
        buffer = `${buffer}\n${trimmed}`
      } else {
        flush()
        buffer = trimmed
        inList = true
      }
      continue
    }
    if (inList) {
      flush()
    }
    buffer = buffer ? `${buffer}\n${trimmed}` : trimmed
  }
  flush()

  return blocks
    .join('\n\n')
    .replace(/\*\*([^*]+?)\*\*/g, (_, inner: string) => `**${inner.trim()}**`)
}

interface ArticleMarkdownProps {
  content: string
  contextTitle?: string
  mediaRecords?: MediaRecord[]
  mediaPreview?: boolean
}

/**
 * Renders Strapi news body (Markdown) as semantic HTML for the public site,
 * automatically compiling sports schedules and tournament groups into rich editorial widgets.
 */
export function ArticleMarkdown({ content, contextTitle = 'Aktualność', mediaRecords = [], mediaPreview = false }: ArticleMarkdownProps) {
  if (!content.trim()) {
    return <p className='muted'>Treść artykułu zostanie uzupełniona przez redakcję.</p>
  }

  const normalized = normalizeNewsMarkdown(content)
  const blocks = extractSemanticBlocks(normalized, contextTitle)
  const navigation: Array<{ id: string; title: string }> = []
  blocks.forEach((block, blockIndex) => {
    if (block.type === 'gallery') {
      if (mediaPreview || block.images.some(image => approvedMedia(mediaRecords, image.src))) navigation.push({ id: `gallery-${blockIndex}`, title: 'Galeria zdjęć' })
    } else if (block.type === 'schedule') navigation.push({ id: `schedule-${blockIndex}`, title: block.title || 'Harmonogram' })
    else if (block.type === 'tournament_groups') navigation.push({ id: `groups-${blockIndex}`, title: block.title || 'Grupy i klasyfikacja' })
    else {
      let fence: string | null = null
      block.content.split('\n').forEach((line, lineIndex) => {
        const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1]
        if (marker) { if (!fence) fence = marker[0]; else if (marker[0] === fence) fence = null; return }
        const heading = !fence && line.match(/^#{2,3}\s+(.+?)\s*#*$/)
        if (heading) navigation.push({ id: `section-${blockIndex}-${lineIndex + 1}`, title: heading[1].replace(/[*_`]/g, '') })
      })
    }
  })

  return (
    <div className='article-markdown'>
      {navigation.length > 0 && (content.length > 2000 || navigation.length >= 3) && <nav className='article-toc' aria-label='Spis treści'><strong>W tym artykule</strong><ul>{navigation.map(item => <li key={item.id}><a href={`#${item.id}`}>{item.title}</a></li>)}</ul></nav>}
      {blocks.map((block, idx) => {
        if (block.type === 'gallery') {
          return (
            <div key={idx} id={`gallery-${idx}`} className='article-markdown__breakout'>
              <ArticleImageCarousel images={block.images.flatMap(image => { const review = approvedMedia(mediaRecords, image.src); return review ? [{ ...image, alt: review.alt, caption: review.caption, author: review.author }] : mediaPreview ? [{ ...image, alt: isCameraOrUuidFilename(image.alt) ? '' : image.alt, metadataMissing: true }] : [] })} />
            </div>
          )
        }

        if (block.type === 'schedule') {
          return (
            <div key={idx} id={`schedule-${idx}`} className='article-markdown__breakout'>
              <ScheduleTimeline items={block.items} title={block.title} />
            </div>
          )
        }

        if (block.type === 'tournament_groups') {
          return (
            <div key={idx} id={`groups-${idx}`} className='article-markdown__breakout'>
              <TournamentGroupsBoard groups={block.groups} title={block.title} />
            </div>
          )
        }

        return (
          <ReactMarkdown
            key={idx}
            remarkPlugins={[remarkBindPolishOrphans]}
            components={{
              h2: ({ children, node }) => <h2 id={`section-${idx}-${node?.position?.start.line}`} className='article-markdown__h2'>{sentenceCaseHeading(children)}</h2>,
              h3: ({ children, node }) => <h3 id={`section-${idx}-${node?.position?.start.line}`} className='article-markdown__h3'>{sentenceCaseHeading(children)}</h3>,
              p: ({ children }) => {
                const text = getChildrenText(children).replace(/\s+/g, ' ').trim()
                const score = parseMatchScore(text)
                if (score) {
                  return (
                    <div
                      className='article-markdown__score'
                      role='group'
                      aria-label={`Wynik meczu: ${score.homeTeam} ${score.homeScore} do ${score.awayScore} ${score.awayTeam}`}
                    >
                      <span className='article-markdown__score-team'>{score.homeTeam}</span>
                      <span className='article-markdown__score-value' aria-hidden='true'>
                        <strong>{score.homeScore}</strong>
                        <span>:</span>
                        <strong>{score.awayScore}</strong>
                      </span>
                      <span className='article-markdown__score-team article-markdown__score-team--away'>{score.awayTeam}</span>
                    </div>
                  )
                }

                const summary = parseSummary(text)
                if (summary) {
                  return (
                    <aside className='article-markdown__summary'>
                      <strong>{summary.title}</strong>
                      <ul className='article-markdown__summary-grid'>
                        {summary.items.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </aside>
                  )
                }
                return <p className='article-markdown__p'>{children}</p>
              },
              strong: ({ children }) => <strong className='article-markdown__strong'>{children}</strong>,
              em: ({ children }) => <em className='article-markdown__em'>{children}</em>,
              blockquote: ({ children }) => <blockquote className='article-markdown__blockquote'>{children}</blockquote>,
              ul: ({ children }) => <ul className='article-markdown__ul'>{children}</ul>,
              ol: ({ children }) => <ol className='article-markdown__ol'>{children}</ol>,
              li: ({ children }) => <li className='article-markdown__li'>{children}</li>,
              hr: () => <hr className='article-markdown__hr' />,
              a: ({ href, children }) => (
                <a href={href} target={href?.startsWith('#') ? undefined : '_blank'} rel={href?.startsWith('#') ? undefined : 'noopener noreferrer'} className='article-markdown__a'>
                  {children}
                </a>
              ),
              img: ({ src, alt }) => {
                const review = approvedMedia(mediaRecords, typeof src === 'string' ? src : '')
                if (!review && !mediaPreview) return null
                const cleanAlt = review?.alt || (typeof alt === 'string' && !isCameraOrUuidFilename(alt) ? alt : '')
                return (
                  <figure className='article-markdown__figure'>
                    <FallbackImage
                      {...getStrapiMediaProps(src, { sizes: '(max-width: 768px) 100vw, (max-width: 1100px) 90vw, 1040px' })}
                      alt={cleanAlt}
                      className='article-markdown__img'
                      fallbackSrc={typeof src === 'string' ? src : undefined}
                    />
                    {alt && !isCameraOrUuidFilename(alt) ? (
                      <figcaption className='article-markdown__figcaption'>{alt}</figcaption>
                    ) : null}
                  </figure>
                )
              }
            }}
          >
            {block.content}
          </ReactMarkdown>
        )
      })}
    </div>
  )
}
