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
});
