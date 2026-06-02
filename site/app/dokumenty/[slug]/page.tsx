import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '../../../components/public-site'
import { getDocuments, getSiteMetadataBase, type DocumentItem } from '../../../lib/data'
import { formatDate } from '../../../lib/format'

type Params = { slug: string }

async function getDocumentBySlug(slug: string): Promise<DocumentItem | null> {
  const items = await getDocuments(250)
  return items.find((item) => item.slug === slug) || null
}

export async function generateStaticParams() {
  const items = await getDocuments(150)
  return items.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const item = await getDocumentBySlug(params.slug)
  if (!item) return { title: 'Dokument | BeKaPaKa Bobolice' }
  return {
    ...getSiteMetadataBase(),
    title: `${item.title} | BeKaPaKa Bobolice`,
    description: `Dokument klubowy: ${item.title}`
  }
}

export default async function DocumentDetailPage({ params }: { params: Params }) {
  const item = await getDocumentBySlug(params.slug)
  if (!item) notFound()

  return (
    <article className='section-card article-detail'>
      <Breadcrumbs items={[{ label: 'Start', href: '/' }, { label: 'Dokumenty', href: '/dokumenty' }, { label: item.title }]} />
      <p className='eyebrow'>Dokument</p>
      <h1>{item.title}</h1>
      <p className='muted'>{item.category} | {formatDate(item.effectiveDate)}</p>
      {item.fileUrl ? (
        <p>
          <a className='button button--primary' href={item.fileUrl} target='_blank' rel='noreferrer'>
            Pobierz dokument
          </a>
        </p>
      ) : (
        <p>Plik nie jest dostepny.</p>
      )}
    </article>
  )
}
