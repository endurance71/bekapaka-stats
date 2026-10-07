import type { Metadata } from 'next'
import Link from 'next/link'
import { ListingTemplate } from '../../components/public/templates/ListingTemplate'
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
    <ListingTemplate
      theme="papier"
      kicker='Stowarzyszenie'
      title='Dokumenty klubowe'
      lead='Regulaminy, formularze i materiały do pobrania.'
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
        <div className="cluster">
          <Link href="/klub" className="btn btn--primary">
            Wróć do informacji o klubie
          </Link>
          <Link href="/klub#kontakt" className="btn btn--secondary">
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
              <p className='muted'>{document.category} · {formatDate(document.effectiveDate)}</p>
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
    </ListingTemplate>
  )
}
