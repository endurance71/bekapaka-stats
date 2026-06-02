import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '../../components/public-site'
import { getDocuments, getSiteMetadataBase } from '../../lib/data'
import { formatDate } from '../../lib/format'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Dokumenty | BeKaPaKa Bobolice',
  description: 'Regulaminy, formularze i dokumenty klubu BeKaPaKa Bobolice.'
}

export default async function DocumentsPage() {
  const documents = await getDocuments(100)

  return (
    <section className='section-card'>
      <PageHeader title='Dokumenty klubowe' description='Regulaminy, formularze i materialy do pobrania.' />
      <ul className='documents-list'>
        {documents.length === 0 ? (
          <li>Brak dokumentow.</li>
        ) : (
          documents.map((document) => (
            <li key={document.id}>
              <div>
                <strong>{document.title}</strong>
                <p className='muted'>{document.category} | {formatDate(document.effectiveDate)}</p>
                <p><Link href={`/dokumenty/${document.slug}`}>Szczegoly dokumentu</Link></p>
              </div>
              {document.fileUrl ? (
                <a href={document.fileUrl} target='_blank' rel='noreferrer'>
                  Pobierz
                </a>
              ) : (
                <span className='muted'>Brak pliku</span>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
