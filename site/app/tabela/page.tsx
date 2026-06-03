import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { StandingsBoardInteractive } from '../../components/public/shared/StandingsBoardInteractive'
import { getLeagueTableState, getSiteMetadataBase } from '../../lib/data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Tabela ligi | BeKaPaKa Bobolice',
  description: 'Aktualna tabela ligi z pozycja BeKaPaKa Bobolice.'
}

export default async function LeagueTablePage() {
  const tableState = await getLeagueTableState()
  const table = tableState.data

  return (
    <EditorialListingTemplate
      title='Tabela ligi'
      description='Aktualna pozycja zespolow i bilans sezonu.'
      hasItems={table.length > 0}
      stateStatus={tableState.status}
      stateSource={tableState.source}
      stateMessage={tableState.message}
      emptyTitle={tableState.status === 'error' ? 'Nie mozna pobrac tabeli' : 'Brak danych tabeli'}
      emptyDescription={
        tableState.status === 'error'
          ? 'Sprawdz backend i endpoint /api/league/table.'
          : 'Tabela pojawi sie po imporcie danych sezonu.'
      }
    >
      <StandingsBoardInteractive table={table} />
    </EditorialListingTemplate>
  )
}
