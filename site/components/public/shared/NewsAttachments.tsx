import type { NewsAttachment } from '../../../lib/data'

function formatFileLabel(attachment: NewsAttachment): string {
  if (attachment.name.trim()) return attachment.name.trim()
  const parts = attachment.url.split('/')
  return parts[parts.length - 1] || 'Pobierz plik'
}

export function formatFileSize(sizeInKb?: number): string | null {
  if (typeof sizeInKb !== 'number' || Number.isNaN(sizeInKb) || sizeInKb <= 0) return null
  if (sizeInKb >= 1024) {
    const mb = sizeInKb / 1024
    return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`
  }
  return `${Math.round(sizeInKb)} KB`
}

export function formatFileBadge(attachment: NewsAttachment): string {
  const ext = (
    attachment.ext ||
    (attachment.name ? attachment.name.slice(attachment.name.lastIndexOf('.')) : '') ||
    (attachment.url ? attachment.url.slice(attachment.url.lastIndexOf('.')) : '')
  )
    .toLowerCase()
    .replace(/^\./, '')

  let typeLabel = ''
  switch (ext) {
    case 'docx':
      typeLabel = 'DOCX · Dokument Word'
      break
    case 'doc':
      typeLabel = 'DOC · Dokument Word'
      break
    case 'pdf':
      typeLabel = 'PDF'
      break
    case 'xlsx':
      typeLabel = 'XLSX · Arkusz Excel'
      break
    case 'xls':
      typeLabel = 'XLS · Arkusz Excel'
      break
    case 'pptx':
    case 'ppt':
      typeLabel = 'Prezentacja PowerPoint'
      break
    case 'odt':
      typeLabel = 'ODT · Dokument tekstowy'
      break
    case 'ods':
      typeLabel = 'ODS · Arkusz kalkulacyjny'
      break
    case 'zip':
    case 'rar':
    case '7z':
      typeLabel = 'Archiwum ZIP'
      break
    default:
      if (attachment.mime?.includes('wordprocessingml') || attachment.mime?.includes('msword')) {
        typeLabel = 'DOCX · Dokument Word'
      } else if (attachment.mime?.includes('pdf')) {
        typeLabel = 'PDF'
      } else if (attachment.mime?.includes('spreadsheetml') || attachment.mime?.includes('excel')) {
        typeLabel = 'XLSX · Arkusz Excel'
      } else if (attachment.mime?.includes('zip')) {
        typeLabel = 'Archiwum ZIP'
      } else {
        typeLabel = ext ? ext.toUpperCase() : 'Plik'
      }
      break
  }

  const sizeLabel = formatFileSize(attachment.size)
  if (sizeLabel) {
    return `${typeLabel} · ${sizeLabel}`
  }
  return typeLabel
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
        {items.map((attachment) => {
          const metaLabel = formatFileBadge(attachment)
          return (
            <li key={attachment.id}>
              <div>
                <strong>{formatFileLabel(attachment)}</strong>
                {metaLabel ? <p className='muted'>{metaLabel}</p> : null}
              </div>
              <a href={attachment.url} target='_blank' rel='noopener noreferrer' download>
                Pobierz
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
