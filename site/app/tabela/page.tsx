import type { Metadata } from 'next'
import { PageHeader } from '../../components/public-site'
import { getLeagueTable, getSiteMetadataBase } from '../../lib/data'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Tabela ligi | BeKaPaKa Bobolice',
  description: 'Aktualna tabela ligi z pozycja BeKaPaKa Bobolice.'
}

export default async function LeagueTablePage() {
  const table = await getLeagueTable()

  return (
    <section className='section-card'>
      <PageHeader title='Tabela ligi' description='Aktualna pozycja zespolow i bilans sezonu.' />
      <div className='table-shell'>
        <table className='data-table'>
          <thead>
            <tr>
              <th scope='col'>Poz.</th>
              <th scope='col'>Druzyna</th>
              <th scope='col'>Bilans</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row) => {
              const isBkp = row.name.toLowerCase().includes('bekapaka')
              return (
                <tr key={`${row.name}-${row.position}`} className={isBkp ? 'is-highlight' : ''}>
                  <td>{row.position}</td>
                  <td>{row.name}</td>
                  <td>{row.wins}-{row.losses}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
