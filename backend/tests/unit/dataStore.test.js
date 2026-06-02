import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import fs from 'fs/promises';
import path from 'path';

const prismaMock = mockDeep();

describe('dataStore.js', () => {
    let dataStore;

    beforeEach(async () => {
        mockReset(prismaMock);

        // Use doMock to avoid hoisting issues with the mock variable
        vi.doMock('@prisma/client', () => ({
            PrismaClient: class {
                constructor() {
                    return prismaMock;
                }
            },
        }));

        // Dynamic import to ensure mock is applied
        dataStore = await import('../../dataStore.js');
    });

    afterEach(() => {
        vi.resetModules();
    });

    describe('resetDatabase', () => {
        it('should delete all data from all tables', async () => {
            await dataStore.resetDatabase();

            expect(prismaMock.game.deleteMany).toHaveBeenCalled();
            expect(prismaMock.leagueMatch.deleteMany).toHaveBeenCalled();
            expect(prismaMock.leagueTeam.deleteMany).toHaveBeenCalled();
            expect(prismaMock.kalkPlayer.deleteMany).toHaveBeenCalled();
            expect(prismaMock.rosterPlayer.deleteMany).toHaveBeenCalled();
        });
    });

    describe('ensureSeeded (via seedDatabase)', () => {
        it('should NOT seed if NODE_ENV is production and auto-seed is disabled', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            process.env.ENABLE_AUTO_SEED = 'false';

            await dataStore.seedDatabase();

            expect(prismaMock.rosterPlayer.count).not.toHaveBeenCalled();

            process.env.NODE_ENV = originalEnv;
        });

        it('should check database count if in development', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            // Mock count to return 1 (already seeded)
            prismaMock.rosterPlayer.count.mockResolvedValue(1);

            await dataStore.seedDatabase();

            expect(prismaMock.rosterPlayer.count).toHaveBeenCalled();
            // Should NOT read file or create data if count > 0
            // access internal 'seeded' state logic

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('updateRosterStats', () => {
        it('should correctly match player stats in box score using tokenized matching', async () => {
            // Mock a game with a box score
            prismaMock.game.findMany.mockResolvedValue([
                {
                    id: 'game-1',
                    playerStats: [
                        { name: 'Kowalski A.', pts: 10, reb: 5, ast: 3, stl: 2, blk: 1, tov: 1, min: '25:00' },
                        { name: 'Kowalski K.', pts: 20, reb: 4, ast: 6, stl: 3, blk: 0, tov: 2, min: '30:00' }
                    ]
                }
            ]);

            // Mock roster with Kamil Kowalski and Andrzej Kowalski
            prismaMock.rosterPlayer.findMany.mockResolvedValue([
                {
                    id: 'kamil-id',
                    firstName: 'Kamil',
                    lastName: 'Kowalski',
                },
                {
                    id: 'andrzej-id',
                    firstName: 'Andrzej',
                    lastName: 'Kowalski',
                }
            ]);

            await dataStore.updateRosterStats();

            // Verify that Andrzej Kowalski (initial A) got the Kowalski A. stats (pts: 10)
            expect(prismaMock.rosterPlayer.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'andrzej-id' },
                data: expect.objectContaining({
                    pts: 10,
                    gamesPlayed: 1
                })
            }));

            // Verify that Kamil Kowalski (initial K) got the Kowalski K. stats (pts: 20)
            expect(prismaMock.rosterPlayer.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'kamil-id' },
                data: expect.objectContaining({
                    pts: 20,
                    gamesPlayed: 1
                })
            }));
        });
    });
});
