import ReactMarkdown from 'react-markdown'
import { ArticleImageCarousel } from './ArticleImageCarousel'
import { getStrapiMediaProps } from '../../../lib/data/media'

const isListLine = (line: string) => /^([-*]|\d+\.)\s+/.test(line)
const isHeadingLine = (line: string) => /^#{1,6}\s+/.test(line)
const isHorizontalRule = (line: string) => /^[-*_]{3,}$/.test(line)

interface ImageInfo {
  src: string
  alt: string
}

type ContentBlock =
  | { type: 'markdown'; content: string }
  | { type: 'gallery'; images: ImageInfo[] }

/**
 * Scan content and group consecutive markdown images (separated only by whitespace or newlines).
 */
function groupMarkdownImages(content: string): ContentBlock[] {
  const matches: { start: number; end: number; alt: string; src: string }[] = []
  const regex = /!\[(.*?)\]\((.*?)\)/g
  let match

  while ((match = regex.exec(content)) !== null) {
    matches.push({
      start: match.index,
      end: regex.lastIndex,
      alt: match[1],
      src: match[2]
    })
  }

  if (matches.length === 0) {
    return [{ type: 'markdown', content }]
  }

  const blocks: ContentBlock[] = []
  const groups: { alt: string; src: string; start: number; end: number }[][] = []
  let currentGroup: { alt: string; src: string; start: number; end: number }[] = []

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    if (currentGroup.length === 0) {
      currentGroup.push(m)
    } else {
      const prev = currentGroup[currentGroup.length - 1]
      const between = content.substring(prev.end, m.start)
      if (/^\s*$/.test(between)) {
        currentGroup.push(m)
      } else {
        groups.push([...currentGroup])
        currentGroup = [m]
      }
    }
  }
  if (currentGroup.length > 0) {
    groups.push([...currentGroup])
  }

  let lastIndex = 0

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g]
    const groupStart = group[0].start
    const groupEnd = group[group.length - 1].end

    if (groupStart > lastIndex) {
      blocks.push({
        type: 'markdown',
        content: content.substring(lastIndex, groupStart)
      })
    }

    blocks.push({
      type: 'gallery',
      images: group.map((img) => ({ src: img.src, alt: img.alt }))
    })

    lastIndex = groupEnd
  }

  if (lastIndex < content.length) {
    blocks.push({
      type: 'markdown',
      content: content.substring(lastIndex)
    })
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

/**
 * Renders Strapi news body (Markdown) as semantic HTML for the public site.
 */
export function ArticleMarkdown({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className='muted'>Treść artykułu zostanie uzupełniona przez redakcję.</p>
  }

  const normalized = normalizeNewsMarkdown(content)
  const blocks = groupMarkdownImages(normalized)

  return (
    <div className='article-markdown'>
      {blocks.map((block, idx) => {
        if (block.type === 'gallery') {
          return <ArticleImageCarousel key={idx} images={block.images} />
        }

        return (
          <ReactMarkdown
            key={idx}
            components={{
              h2: ({ children }) => <h2 className='article-markdown__h2'>{children}</h2>,
              h3: ({ children }) => <h3 className='article-markdown__h3'>{children}</h3>,
              p: ({ children }) => <p className='article-markdown__p'>{children}</p>,
              strong: ({ children }) => <strong className='article-markdown__strong'>{children}</strong>,
              em: ({ children }) => <em className='article-markdown__em'>{children}</em>,
              blockquote: ({ children }) => <blockquote className='article-markdown__blockquote'>{children}</blockquote>,
              ul: ({ children }) => <ul className='article-markdown__ul'>{children}</ul>,
              ol: ({ children }) => <ol className='article-markdown__ol'>{children}</ol>,
              li: ({ children }) => <li className='article-markdown__li'>{children}</li>,
              hr: () => <hr className='article-markdown__hr' />,
              a: ({ href, children }) => (
                <a href={href} target='_blank' rel='noopener noreferrer' className='article-markdown__a'>
                  {children}
                </a>
              ),
              img: ({ src, alt }) => (
                <figure className='article-markdown__figure'>
                  <img
                    {...getStrapiMediaProps(src, { sizes: '(max-width: 768px) 100vw, (max-width: 1100px) 90vw, 1040px' })}
                    alt={alt || ''}
                    className='article-markdown__img'
                  />
                  {alt && <figcaption className='article-markdown__figcaption'>{alt}</figcaption>}
                </figure>
              )
            }}
          >
            {block.content}
          </ReactMarkdown>
        )
      })}
    </div>
  )
}

