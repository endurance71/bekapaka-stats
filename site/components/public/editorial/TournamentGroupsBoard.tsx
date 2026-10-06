import React from 'react'

export interface TournamentGroup {
  name: string
  teams: string[]
}

interface TournamentGroupsBoardProps {
  groups: TournamentGroup[]
  title?: string
}

export function TournamentGroupsBoard({ groups, title }: TournamentGroupsBoardProps) {
  if (!groups || groups.length === 0) return null

  return (
    <section className='tournament-groups' aria-label={title || 'Podział na grupy turniejowe'}>
      {title ? <h3 className='tournament-groups__heading'>{title}</h3> : null}
      <div className={`tournament-groups__grid tournament-groups__grid--${Math.min(groups.length, 4)}`}>
        {groups.map((group, gIdx) => (
          <div key={gIdx} className='tournament-groups__card card'>
            <header className='tournament-groups__card-header'>
              <div className='tournament-groups__badge-wrap'>
                <img src="/brand/sygnet2-kolor-ciasny.svg" width={24} height={24} alt="" />
                <h4 className='tournament-groups__name'>{group.name}</h4>
              </div>
              <span className='tournament-groups__count'>{group.teams.length} drużyn</span>
            </header>
            <ol className='tournament-groups__team-list'>
              {group.teams.map((team, tIdx) => {
                const isBekapaka = /bekapaka/i.test(team)
                return (
                  <li
                    key={tIdx}
                    className={`tournament-groups__team-item ${isBekapaka ? 'tournament-groups__team-item--bkpk' : ''}`}
                  >
                    <span className='tournament-groups__team-seed' aria-hidden='true'>{tIdx + 1}</span>
                    <span className='tournament-groups__team-name'>{team}</span>
                    {isBekapaka ? (
                      <span className='tournament-groups__team-flag'>BKPK</span>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}
