import type { NewsAttachment } from '../../../lib/data'

function formatFileLabel(attachment: NewsAttachment): string {
  if (attachment.name.trim()) return attachment.name.trim()
  const parts = attachment.url.split('/')
  return parts[parts.length - 1] || 'Pobierz plik'
}

/**
 * Download links for files attached to a news post in Strapi.
 */
export function NewsAttachments({ items }: { items: NewsAttachment[] }) {
  if (items.length === 0) return null

  return (
    <section className='article-attachments' aria-labelledby='article-attachments-heading'>
      <h2 id='article-attachments-heading' className='article-attachments__title'>
        Załączniki
      </h2>
      <ul className='documents-list'>
        {items.map((attachment) => (
          <li key={attachment.id}>
            <div>
              <strong>{formatFileLabel(attachment)}</strong>
              {attachment.mime ? <p className='muted'>{attachment.mime}</p> : null}
            </div>
            <a href={attachment.url} target='_blank' rel='noopener noreferrer' download>
              Pobierz
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
