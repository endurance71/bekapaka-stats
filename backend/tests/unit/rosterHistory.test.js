import { describe, expect, it } from 'vitest';
import { linkRosterFromHistory } from '../../kalk/v2/rosterHistory.js';

const prof = (slug, firstName, lastName) => ({ slug, firstName, lastName, fullName: `${firstName} ${lastName}` });
const stat = (playerSlug, seasonId, teamName = 'BeKaPaKa BOBOLICE') => ({ playerSlug, seasonId, teamName });

describe('powiązanie składu z historii KALK v2', () => {
  it('zawodnik bez meczu w bieżącym sezonie: slug z profilu, wiersz KALK z ostatniego sezonu w BeKaPaKa', () => {
    const roster = [{ id: 'r1', firstName: 'Pablo', lastName: 'Iriarte', kalkSlug: null, kalkPlayerId: '2025-2026__zawodnikpablo-iriarte43080html' }];
    const source = {
      profiles: [prof('pablo-iriarte', 'Pablo', 'Iriarte')],
      seasonStats: [stat('pablo-iriarte', 'season_2023-2024'), stat('pablo-iriarte', 'season_2025-2026')],
      kalkPlayers: [
        { id: '2023-2024__pablo-iriarte', seasonId: 'season_2023-2024' },
        { id: '2025-2026__pablo-iriarte', seasonId: 'season_2025-2026' },
        { id: '2025-2026__zawodnikpablo-iriarte43080html', seasonId: 'season_2025-2026' }
      ]
    };
    expect(linkRosterFromHistory(roster, source)).toEqual([{ rosterId: 'r1', kalkSlug: 'pablo-iriarte', kalkPlayerId: '2025-2026__pablo-iriarte' }]);
  });

  it('bez wiersza KALK z tym slugiem: tylko slug (kalkPlayerId bez zmian)', () => {
    const roster = [{ id: 'r1', firstName: 'Pablo', lastName: 'Iriarte', kalkSlug: null }];
    const out = linkRosterFromHistory(roster, { profiles: [prof('pablo-iriarte', 'Pablo', 'Iriarte')], seasonStats: [stat('pablo-iriarte', 'season_2024-2025')], kalkPlayers: [] });
    expect(out).toEqual([{ rosterId: 'r1', kalkSlug: 'pablo-iriarte', kalkPlayerId: null }]);
  });

  it('bez zgadywania: tylko inna drużyna, dwóch zawodników o tym nazwisku, slug zajęty, już powiązany', () => {
    const roster = [
      { id: 'r1', firstName: 'Jan', lastName: 'Nowak', kalkSlug: null },
      { id: 'r2', firstName: 'Adam', lastName: 'Kot', kalkSlug: null },
      { id: 'r3', firstName: 'Ewa', lastName: 'Lis', kalkSlug: null },
      { id: 'r4', firstName: 'Ola', lastName: 'Lis', kalkSlug: 'ewa-lis' },
      { id: 'r5', firstName: 'Piotr', lastName: 'Ryś', kalkSlug: 'piotr-rys' }
    ];
    const source = {
      profiles: [prof('jan-nowak', 'Jan', 'Nowak'), prof('adam-kot', 'Adam', 'Kot'), prof('adam-kot-2', 'Adam', 'Kot'), prof('ewa-lis', 'Ewa', 'Lis'), prof('piotr-rys-2', 'Piotr', 'Ryś')],
      seasonStats: [stat('jan-nowak', 's1', 'Pantery'), stat('adam-kot', 's1'), stat('adam-kot-2', 's2'), stat('ewa-lis', 's1'), stat('piotr-rys-2', 's1')],
      kalkPlayers: []
    };
    expect(linkRosterFromHistory(roster, source)).toEqual([]);
  });
});
