import type { Metadata } from 'next'
import { ListingTemplate } from '../../components/public/templates/ListingTemplate'
import { PositionSummary } from '../../components/public/shared/PositionSummary'
import { StandingsBoard } from '../../components/public/shared/StandingsBoard'
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

  const updated = tableState.meta?.updatedAt
    ? new Date(tableState.meta.updatedAt).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'long', timeStyle: 'short' })
    : null

  return (
    <ListingTemplate
      kicker={['KALK Koszalin', tableState.meta?.division].filter(Boolean).join(' · ')}
      title='Tabela ligi'
      lead={`${tableState.meta?.season?.label || 'Sezon niepotwierdzony'} · Koszalińska Amatorska Liga Koszykówki. Za wygraną 2 pkt, za porażkę 1 pkt.`}
      headerAside={table.length > 0 ? <PositionSummary table={table} kicker='BeKaPaKa' /> : undefined}
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
      <StandingsBoard table={table} />
      <p className='table-updated'>{updated ? `Dane ligi z ${updated}.` : 'Data aktualizacji danych ligi nie jest dostępna.'}</p>
    </ListingTemplate>
  )
}
