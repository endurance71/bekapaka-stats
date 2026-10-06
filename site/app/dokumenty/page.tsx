import type { Metadata } from 'next'
import Link from 'next/link'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getDocumentsState, getSiteMetadataBase } from '../../lib/data'
import { formatDate } from '../../lib/format'

export const revalidate = 60

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  alternates: { canonical: '/dokumenty' },
  title: 'Dokumenty | BeKaPaKa Bobolice',
  description: 'Regulaminy, formularze i dokumenty klubu BeKaPaKa Bobolice.'
}

export default async function DocumentsPage() {
  const documentsState = await getDocumentsState(100)
  const documents = documentsState.data

  return (
    <EditorialListingTemplate
      theme="papier"
      title='Dokumenty klubowe'
      description='Regulaminy, formularze i materiały do pobrania.'
      hasItems={documents.length > 0}
      stateStatus={documentsState.status}
      stateSource={documentsState.source}
      stateMessage={documentsState.message}
      emptyTitle={documentsState.status === 'error' ? 'Nie można pobrać dokumentów' : 'Brak dokumentów'}
      emptyDescription={
        documentsState.status === 'error'
          ? 'Odśwież stronę lub wróć za chwilę.'
          : 'Klub nie opublikował jeszcze oficjalnych regulaminów ani formularzy do pobrania.'
      }
      emptyAction={
        <div className="cluster" style={{ marginTop: 'var(--space-4)', gap: 'var(--space-4)' }}>
          <Link href="/klub" className="button button--primary">
            Wróć do informacji o klubie
          </Link>
          <Link href="/klub#kontakt" className="button button--ghost">
            Skontaktuj się z klubem
          </Link>
        </div>
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
