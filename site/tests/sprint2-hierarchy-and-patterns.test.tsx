import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import { normalizeRoundName } from '../../packages/match-presentation'
import { StreakBadge, StandingsBoard } from '../components/public/shared/StandingsBoard'
import { MatchHero } from '../components/public/match/MatchHero'
import type { GameSummary, TeamStanding } from '../lib/data'

describe('Sprint 2: Hierarchy, Presentation & Navigation Patterns', () => {
  describe('UI-12: Round name normalization', () => {
    it('normalizes various KALK round formats to clean Polish ordinal representation', () => {
      expect(normalizeRoundName('Kolejka - 3')).toBe('3. kolejka')
      expect(normalizeRoundName('RZ-3')).toBe('3. kolejka')
      expect(normalizeRoundName('kolejka 5')).toBe('5. kolejka')
      expect(normalizeRoundName('Finał')).toBe('Finał')
      expect(normalizeRoundName(null)).toBe('')
      expect(normalizeRoundName(undefined)).toBe('')
    })
  })

  describe('UI-13: Match directions link', () => {
    const scheduledGame: GameSummary = {
      id: 'match-101',
      date: '2026-11-20T18:00:00Z',
      opponent: 'Twarde Pierniki',
      scoreUs: null,
      scoreThem: null,
      status: 'SCHEDULED',
      venue: 'Hala KOSiR, Koszalin',
      round: 'Kolejka - 4'
    }

    it('renders Dojazd directions link with Google Maps search query for scheduled match', () => {
      const html = renderToStaticMarkup(<MatchHero game={scheduledGame} />)
      expect(html).toContain('Szukaj hali w mapach')
      expect(html).toContain('google.com/maps/search/?api=1&amp;query=')
      expect(html).toContain(encodeURIComponent('Hala KOSiR, Koszalin'))
    })
  })

  describe('UI-15 & UI-14: Standings streak normalization and legend', () => {
    it('normalizes English loss streak L to Polish P in StreakBadge', () => {
      const html = renderToStaticMarkup(<StreakBadge streak="L2" />)
      expect(html).toContain('P2')
      expect(html).toContain('standings-badge--loss')
    })

    it('preserves win streak W in StreakBadge', () => {
      const html = renderToStaticMarkup(<StreakBadge streak="W3" />)
      expect(html).toContain('W3')
      expect(html).toContain('standings-badge--win')
    })

    it('renders acronym legend explaining table columns', () => {
      const mockTable: TeamStanding[] = [
        {
          position: 1,
          name: 'BeKaPaKa Bobolice',
          wins: 5,
          losses: 1,
          points: 11,
          pointsFor: 420,
          pointsAgainst: 380,
          form: ['W', 'W', 'W', 'P', 'W'],
          streak: 'W1'
        }
      ]

      const html = renderToStaticMarkup(<StandingsBoard table={mockTable} />)
      expect(html).toContain('mecze')
      expect(html).toContain('wygrane')
      expect(html).toContain('porażki')
      expect(html).toContain('punkty ligowe')
    })
  })
})
