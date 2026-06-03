import type { TeamStanding } from '../../../lib/data'

function isBekapakaRow(name: string) {
  return name.toLowerCase().includes('bekapaka')
}

export function StandingsBoard({ table, className }: { table: TeamStanding[]; className?: string }) {
  return (
    <div className={`standings-board${className ? ` ${className}` : ''}`} role='table' aria-label='Tabela ligowa'>
      <div className='standings-board__head' role='row'>
        <span role='columnheader'>#</span>
        <span role='columnheader'>Drużyna</span>
        <span className='col-balance' role='columnheader'>Bilans</span>
        <span role='columnheader'>Pkt</span>
      </div>
      <div className='standings-board__body'>
        {table.map((row) => {
          const isBkp = isBekapakaRow(row.name)
          const points = row.wins * 2 + row.losses
          return (
            <div
              key={`${row.name}-${row.position}`}
              className={`standings-row ${isBkp ? 'is-bkp' : ''}`}
              role='row'
            >
              <span className='standings-row__pos' role='cell'>
                <span className='standings-row__pos-badge'>{row.position}</span>
              </span>
              <span className='standings-row__team' role='cell'>
                {row.name}
              </span>
              <span className='standings-row__meta col-balance' role='cell'>
                <span className='standings-row__stat'>{row.wins + row.losses} M</span>
                <span className='standings-row__stat'>
                  {row.wins}-{row.losses}
                </span>
              </span>
              <span className='standings-row__points' role='cell'>
                {points}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
