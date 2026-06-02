import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getLeagueTableState, getSiteMetadataBase } from '../../lib/data'

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
      emptyTitle={tableState.status === 'error' ? 'Nie mozna pobrac tabeli' : 'Brak danych tabeli'}
      emptyDescription={
        tableState.status === 'error'
          ? 'Sprawdz backend i endpoint /api/league/table.'
          : 'Tabela pojawi sie po imporcie danych sezonu.'
      }
    >
      <div className='table-shell'>
        <table className='data-table'>
          <thead>
            <tr>
              <th scope='col' style={{ width: '60px' }}>Poz.</th>
              <th scope='col'>Druzyna</th>
              <th scope='col' style={{ width: '80px' }}>Mecze</th>
              <th scope='col' style={{ width: '120px' }}>Bilans</th>
              <th scope='col' style={{ width: '80px' }}>Pkt</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row) => {
              const isBkp = row.name.toLowerCase().includes('bekapaka')
              return (
                <tr key={`${row.name}-${row.position}`} className={isBkp ? 'is-highlight' : ''}>
                  <td><strong>{row.position}</strong></td>
                  <td>
                    {isBkp ? <span style={{ color: 'var(--bkp-gold)', fontWeight: 700 }}>{row.name}</span> : row.name}
                  </td>
                  <td>{row.wins + row.losses}</td>
                  <td>{row.wins} - {row.losses}</td>
                  <td><strong>{row.wins * 2 + row.losses}</strong></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </EditorialListingTemplate>
  )
}
