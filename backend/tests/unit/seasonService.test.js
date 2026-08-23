import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

const prismaMock = mockDeep();

describe('seasonService.js', () => {
  let seasonService;

  beforeEach(async () => {
    mockReset(prismaMock);

    vi.doMock('../../lib/prisma.js', () => ({
      prisma: prismaMock
    }));

    seasonService = await import('../../seasonService.js');
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('createSeason', () => {
    it('creates a new season and normalizes slug', async () => {
      prismaMock.kalkSeason.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
      prismaMock.kalkSeason.create.mockImplementation(({ data }) => Promise.resolve(data));

      const result = await seasonService.createSeason({
        slug: '2026-2027',
        label: 'Sezon 2026/2027',
        divisionPath: 'dzial,dywizja-1,1.html',
        activateNow: true
      });

      expect(result.id).toBe('season_2026-2027');
      expect(result.slug).toBe('2026-2027');
      expect(result.label).toBe('Sezon 2026/2027');
      expect(result.isActive).toBe(true);
      expect(prismaMock.kalkSeason.updateMany).toHaveBeenCalledWith({ data: { isActive: false } });
    });

    it('throws error if season with the same slug already exists', async () => {
      prismaMock.kalkSeason.findUnique.mockResolvedValue({ id: 'season_2026-2027' });

      await expect(
        seasonService.createSeason({
          slug: '2026-2027',
          label: 'Sezon 2026/2027'
        })
      ).rejects.toThrow(/już istnieje/);
    });
  });

  describe('activateSeason', () => {
    it('deactivates other seasons and activates the requested season', async () => {
      prismaMock.kalkSeason.findUnique.mockResolvedValue({ id: 'season_2026-2027', isActive: false });
      prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
      prismaMock.kalkSeason.update.mockResolvedValue({ id: 'season_2026-2027', isActive: true });

      const result = await seasonService.activateSeason('season_2026-2027');

      expect(prismaMock.kalkSeason.updateMany).toHaveBeenCalledWith({
        where: { id: { not: 'season_2026-2027' } },
        data: { isActive: false }
      });
      expect(prismaMock.kalkSeason.update).toHaveBeenCalledWith({
        where: { id: 'season_2026-2027' },
        data: { isActive: true }
      });
      expect(result.isActive).toBe(true);
    });
  });

  describe('archiveSeason', () => {
    it('sets isActive to false and sets endsAt', async () => {
      prismaMock.kalkSeason.findUnique.mockResolvedValue({
        id: 'season_2025-2026',
        isActive: true,
        endsAt: null
      });
      prismaMock.kalkSeason.update.mockResolvedValue({
        id: 'season_2025-2026',
        isActive: false
      });

      const result = await seasonService.archiveSeason('season_2025-2026');

      expect(prismaMock.kalkSeason.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'season_2025-2026' },
          data: expect.objectContaining({ isActive: false })
        })
      );
      expect(result.isActive).toBe(false);
    });
  });

  describe('rolloverRoster', () => {
    it('migrates player season preferences to new season and optionally resets goals', async () => {
      const targetSeason = { id: 'season_2026-2027', label: 'Sezon 2026/2027' };
      prismaMock.kalkSeason.findUnique.mockResolvedValue(targetSeason);
      prismaMock.rosterPlayer.findMany.mockResolvedValue([
        { id: 'p1', firstName: 'Damian', lastName: 'Motylinski', goals: { ppg: 20 } },
        { id: 'p2', firstName: 'Emil', lastName: 'Kłos', goals: { ppg: 15 } }
      ]);
      prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));

      const result = await seasonService.rolloverRoster({
        targetSeasonId: 'season_2026-2027',
        activePlayerIds: ['p1'],
        resetGoals: true
      });

      expect(result.playersCount).toBe(2);
      expect(result.activeInNewSeason).toBe(1);
      expect(prismaMock.playerSeasonPreference.upsert).toHaveBeenCalledTimes(2);
      expect(prismaMock.rosterPlayer.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { goals: null }
      });
    });
  });

  describe('getSeasonSummary', () => {
    it('returns season stats including bekapaka matches count and league counts', async () => {
      const season = { id: 'season_2025-2026', label: 'Sezon 2025/2026' };
      prismaMock.kalkSeason.findUnique.mockResolvedValue(season);
      prismaMock.kalkMatch.count.mockResolvedValueOnce(15); // bekapakaMatchesCount
      prismaMock.leagueMatch.count.mockResolvedValueOnce(83); // leagueMatchesCount
      prismaMock.kalkMatch.count.mockResolvedValueOnce(73); // finishedMatchesCount
      prismaMock.kalkPlayer.count.mockResolvedValueOnce(149); // kalkPlayersCount
      prismaMock.kalkTeam.count.mockResolvedValueOnce(10); // kalkTeamsCount

      const result = await seasonService.getSeasonSummary('season_2025-2026');

      expect(result.stats.bekapakaMatchesCount).toBe(15);
      expect(result.stats.leagueMatchesCount).toBe(83);
      expect(result.stats.finishedMatchesCount).toBe(73);
      expect(result.stats.kalkPlayersCount).toBe(149);
      expect(result.stats.kalkTeamsCount).toBe(10);
    });
  });
});

