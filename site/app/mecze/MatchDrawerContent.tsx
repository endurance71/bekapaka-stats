import type { GameSummary } from '../../lib/data'
import { formatDateTime } from '../../lib/format'
import { MarkdownContent } from '../../components/public/shared/MarkdownContent'

function getTeamsFromGame(game: GameSummary) {
  const teams = game.teams || game.data?.teams
  if (!Array.isArray(teams)) return null
  const us = teams.find(
    (t) =>
      t.isBekapaka ||
      t.name?.toLowerCase().includes('bekapaka') ||
      t.name?.toLowerCase().includes('bobolice')
  )
  const them = teams.find((t) => t !== us)
  return { us, them }
}

export function MatchDrawerContent({ game }: { game: GameSummary }) {
  const isWin = (game.scoreUs || 0) > (game.scoreThem || 0)
  const teams = getTeamsFromGame(game)

  const statKeys = [
    { key: 'Punkty spod kosza', label: 'Punkty z pomalowanego' },
    { key: 'Punkty po szybkim ataku', label: 'Punkty z szybkiego ataku' },
    { key: 'Punkty po stratach', label: 'Punkty po stratach rywala' },
    { key: 'Punkty drugiej szansy', label: 'Punkty 2. szansy' },
    { key: 'Punkty zmiennikow', label: 'Punkty rezerwowych' },
    { key: 'Punkty zmienników', label: 'Punkty rezerwowych' }
  ]

  const comparisonStats = game.data?.teamStats
  const availableStats =
    comparisonStats && typeof comparisonStats === 'object'
      ? statKeys
          .map((sk) => {
            const val = comparisonStats[sk.key as keyof typeof comparisonStats] as
              | { home?: number; away?: number }
              | undefined
            if (!val) return null
            return { label: sk.label, home: val.home || 0, away: val.away || 0 }
          })
          .filter(Boolean) as { label: string; home: number; away: number }[]
      : []

  const players =
    teams?.us && Array.isArray(teams.us.players)
      ? teams.us.players
          .filter((p: { name?: string; min?: string }) => p.name && p.min)
          .sort((a: { pts: number }, b: { pts: number }) => (b.pts || 0) - (a.pts || 0))
      : []

  return (
    <div className='drawer-stack-v2'>
      {/* Scoreboard Header */}
      <div className='drawer-match-header'>
        <p className='drawer-match-meta'>
          {formatDateTime(game.date)} {game.data?.venue ? ` · 📍 ${game.data.venue}` : ''}
        </p>
        
        <div className='drawer-match-scoreboard'>
          <div className='scoreboard-team'>
            <span className='scoreboard-team-name'>BeKaPaKa</span>
            <span className='scoreboard-team-role'>GOSPODARZ</span>
          </div>
          <div className='scoreboard-score-numbers' aria-label={`Wynik ${game.scoreUs} do ${game.scoreThem}`}>
            <span className={isWin ? 'color-win' : undefined}>{game.scoreUs}</span>
            <span className='score-sep'>:</span>
            <span className={!isWin ? 'color-win' : undefined}>{game.scoreThem}</span>
          </div>
          <div className='scoreboard-team text-right'>
            <span className='scoreboard-team-name'>{game.opponent}</span>
            <span className='scoreboard-team-role'>GOŚĆ</span>
          </div>
        </div>
        
        <div className='drawer-match-badge-wrap'>
          <span className={`pill ${isWin ? 'pill--win' : 'pill--loss'}`}>
            {isWin ? 'Zwycięstwo BeKaPaKa' : 'Porażka'}
          </span>
        </div>
      </div>

      {/* Quarters Breakdown */}
      {game.data?.quarters && Array.isArray(game.data.quarters) ? (
        <section className='drawer-match-section'>
          <h3 className='drawer-section-title-small'>Wyniki w kwartach</h3>
          <div className='quarters-grid-premium'>
            {game.data.quarters.map((q: { label: string; home: number; away: number }, idx: number) => (
              <div key={idx} className='quarter-cell-premium'>
                <div className='q-label'>{q.label || `Q${idx + 1}`}</div>
                <div className='q-scores'>
                  <span className='q-score-home'>{q.home}</span>
                  <span className='q-score-sep'>-</span>
                  <span className='q-score-away'>{q.away}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Team Comparison Stats */}
      {availableStats.length > 0 ? (
        <section className='drawer-match-section'>
          <h3 className='drawer-section-title-small'>Statystyki zespołowe</h3>
          <div className='team-comparison-list'>
            {availableStats.map((stat, idx) => {
              const total = stat.home + stat.away
              const homePct = total > 0 ? (stat.home / total) * 100 : 50
              return (
                <div key={idx} className='stat-compare-item'>
                  <div className='sci-labels'>
                    <span className='sci-val-home highlight-gold'>{stat.home}</span>
                    <span className='sci-name'>{stat.label}</span>
                    <span className='sci-val-away'>{stat.away}</span>
                  </div>
                  <div className='sci-bar-track'>
                    <div className='sci-bar-fill-home' style={{ width: `${homePct}%` }} />
                    <div className='sci-bar-fill-away' style={{ width: `${100 - homePct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* AI Match Summary */}
      {game.aiSummary ? (
        <section className='ai-development-card-premium'>
          <div className='ai-card-title'>
            <span className='ai-spark-icon'>✨</span>
            <h4>Analiza Meczowa AI (Gemini Agent)</h4>
          </div>
          <div className='ai-card-body'>
            <MarkdownContent markdown={game.aiSummary} />
          </div>
        </section>
      ) : null}

      {/* Coach Notes */}
      {game.coachNotes ? (
        <section className='drawer-match-section coach-notes-block'>
          <h3 className='drawer-section-title-small'>Notatki sztabu trenerskiego</h3>
          <p className='coach-notes-text'>{game.coachNotes}</p>
        </section>
      ) : null}

      {/* Box Score Player Stats Table */}
      {players.length > 0 ? (
        <section className='drawer-match-section'>
          <h3 className='drawer-section-title-small'>Statystyki indywidualne BeKaPaKa</h3>
          <div className='table-shell-v2'>
            <table className='data-table-v2 text-sm'>
              <thead>
                <tr>
                  <th>Zawodnik</th>
                  <th className='text-center'>MIN</th>
                  <th className='text-center highlight-gold'>PTS</th>
                  <th className='text-center'>AST</th>
                  <th className='text-center'>STL</th>
                  <th className='text-center'>BLK</th>
                  <th className='text-center'>+/-</th>
                </tr>
              </thead>
              <tbody>
                {players.map(
                  (
                    p: {
                      name: string
                      number: string
                      min: string
                      pts: number
                      ast: number
                      stl?: number
                      blk?: number
                      plusMinus: number
                    },
                    idx: number
                  ) => (
                    <tr key={idx}>
                      <td>
                        <strong>{p.name}</strong> <span className='muted text-xs'>#{p.number}</span>
                      </td>
                      <td className='text-center font-mono'>{p.min}</td>
                      <td className='text-center font-bold font-mono highlight-gold'>{p.pts}</td>
                      <td className='text-center font-mono'>{p.ast}</td>
                      <td className='text-center font-mono'>{p.stl ?? 0}</td>
                      <td className='text-center font-mono'>{p.blk ?? 0}</td>
                      <td className={`text-center font-bold font-mono ${p.plusMinus > 0 ? 'color-win' : p.plusMinus < 0 ? 'color-loss' : ''}`}>
                        {p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Highlight Video Action Button */}
      {game.videoUrl ? (
        <a 
          href={game.videoUrl} 
          target='_blank' 
          rel='noopener noreferrer' 
          className='button button--primary stub-button' 
          style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
        >
          🎥 Oglądaj skrót wideo z meczu
        </a>
      ) : null}
    </div>
  )
}
