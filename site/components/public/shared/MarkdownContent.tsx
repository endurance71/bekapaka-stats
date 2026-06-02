export function MarkdownContent({ markdown }: { markdown?: string | null }) {
  if (!markdown) return null

  const lines = markdown.split('\n')

  return (
    <div className='markdown-content'>
      {lines.map((line, idx) => {
        let text = line.trim()
        if (!text) return <div key={idx} className='markdown-content__spacer' aria-hidden='true' />

        if (text.startsWith('###')) {
          return <h5 key={idx}>{text.replace('###', '').trim()}</h5>
        }
        if (text.startsWith('##') || text.startsWith('#')) {
          return <h4 key={idx}>{text.replace(/^#+\s*/, '').trim()}</h4>
        }

        let isListItem = false
        if (text.startsWith('-') || text.startsWith('*')) {
          isListItem = true
          text = text.substring(1).trim()
        }

        const parts = text.split('**')
        const content = parts.map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        )

        if (isListItem) {
          return <li key={idx}>{content}</li>
        }

        return <p key={idx}>{content}</p>
      })}
    </div>
  )
}
