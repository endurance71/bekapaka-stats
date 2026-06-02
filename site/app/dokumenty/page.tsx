import type { Metadata } from 'next'
import Link from 'next/link'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getDocumentsState, getSiteMetadataBase } from '../../lib/data'
import { formatDate } from '../../lib/format'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Dokumenty | BeKaPaKa Bobolice',
  description: 'Regulaminy, formularze i dokumenty klubu BeKaPaKa Bobolice.'
}

export default async function DocumentsPage() {
  const documentsState = await getDocumentsState(100)
  const documents = documentsState.data

  return (
    <EditorialListingTemplate
      title='Dokumenty klubowe'
      description='Regulaminy, formularze i materialy do pobrania.'
      hasItems={documents.length > 0}
      stateStatus={documentsState.status}
      stateSource={documentsState.source}
      stateMessage={documentsState.message}
      emptyTitle={documentsState.status === 'error' ? 'Nie mozna pobrac dokumentow' : 'Brak dokumentow'}
      emptyDescription={
        documentsState.status === 'error'
          ? 'Sprawdz konfiguracje CMS i token dostepu.'
          : 'Po dodaniu dokumentow w CMS pojawia sie tutaj automatycznie.'
      }
    >
      <ul className='documents-list'>
        {documents.map((document) => (
          <li key={document.id}>
            <div>
              <strong>{document.title}</strong>
              <p className='muted'>{document.category} | {formatDate(document.effectiveDate)}</p>
              <p><Link href={`/dokumenty/${document.slug}`}>Szczegóły dokumentu</Link></p>
            </div>
            {document.fileUrl && document.fileUrl !== '#' ? (
              <a href={document.fileUrl} target='_blank' rel='noreferrer'>
                Pobierz
              </a>
            ) : (
              <span className='muted'>Brak pliku</span>
            )}
          </li>
        ))}
      </ul>
    </EditorialListingTemplate>
  )
}
