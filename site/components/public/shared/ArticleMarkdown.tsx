import ReactMarkdown from 'react-markdown'

const isListLine = (line: string) => /^[-*]\s+/.test(line)
const isHeadingLine = (line: string) => /^#{1,6}\s+/.test(line)

/**
 * Strapi editors often use single line breaks; merge prose lines so **bold** parses correctly.
 */
function normalizeNewsMarkdown(content: string): string {
  const lines = content.split('\n')
  const blocks: string[] = []
  let buffer = ''

  const flush = () => {
    if (buffer.trim()) blocks.push(buffer.trim())
    buffer = ''
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flush()
      continue
    }
    if (isListLine(trimmed) || isHeadingLine(trimmed)) {
      flush()
      blocks.push(trimmed)
      continue
    }
    buffer = buffer ? `${buffer} ${trimmed}` : trimmed
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

  return (
    <ReactMarkdown
      className='article-markdown'
      components={{
        h2: ({ children }) => <h2 className='article-markdown__h2'>{children}</h2>,
        h3: ({ children }) => <h3 className='article-markdown__h3'>{children}</h3>,
        p: ({ children }) => <p>{children}</p>,
        strong: ({ children }) => <strong>{children}</strong>,
        em: ({ children }) => <em>{children}</em>,
        ul: ({ children }) => <ul>{children}</ul>,
        ol: ({ children }) => <ol>{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        a: ({ href, children }) => (
          <a href={href} target='_blank' rel='noopener noreferrer'>
            {children}
          </a>
        )
      }}
    >
      {normalizeNewsMarkdown(content)}
    </ReactMarkdown>
  )
}
