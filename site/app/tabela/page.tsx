import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { StandingsBoardInteractive } from '../../components/public/shared/StandingsBoardInteractive'
import { getLeagueTableState, getSiteMetadataBase } from '../../lib/data'

export const revalidate = 60

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  alternates: { canonical: '/tabela' },
  title: 'Tabela ligi | BeKaPaKa Bobolice',
  description: 'Aktualna tabela ligi z pozycją BeKaPaKa Bobolice.'
}

export default async function LeagueTablePage() {
  const tableState = await getLeagueTableState()
  const table = tableState.data

  return (
    <EditorialListingTemplate
      title='Tabela ligi'
      eyebrow='KALK Koszalin · Dywizja II'
      description='Sezon 2026/2027 · Aktualna pozycja zespołów, bilans meczów i punktacja.'
      hasItems={table.length > 0}
      stateStatus={tableState.status}
      stateSource={tableState.source}
      stateMessage={tableState.message}
      emptyTitle={tableState.status === 'error' ? 'Nie można pobrać tabeli' : 'Brak danych tabeli'}
      emptyDescription={
        tableState.status === 'error'
          ? 'Odśwież stronę lub wróć za chwilę.'
          : 'Tabela zostanie uzupełniona po potwierdzeniu danych sezonu.'
      }
    >
      <StandingsBoardInteractive table={table} />
    </EditorialListingTemplate>
  )
}
