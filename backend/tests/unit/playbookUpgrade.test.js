import { describe, expect, it, vi } from 'vitest';
import { upgradePresetPlays } from '../../lib/playbookUpgrade.js';

describe('aktualizacja zagrywek z presetów', () => {
  it('tylko presety pod starą nazwą, bez zagrywek z AI; nic do zrobienia → 0', async () => {
    const update = vi.fn();
    const findMany = vi.fn(async ({ where }) => {
      expect(where).toEqual({ name: { in: ['Horns Flare vs Strefa 2-3'] }, isAiGenerated: false });
      return [{ id: 'p1', name: 'Horns Flare vs Strefa 2-3' }];
    });
    const presets = [
      { name: 'Rogi z zasłoną odchodzącą (Horns Flare)', legacyName: 'Horns Flare vs Strefa 2-3', targetDefense: 'Strefa 2-3', description: 'Opis', diagramData: { steps: [] }, tags: ['strefa'] },
      { name: 'Bez zmiany nazwy', legacyName: 'Bez zmiany nazwy' }
    ];
    expect(await upgradePresetPlays({ play: { findMany, update } }, presets)).toBe(1);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { name: 'Rogi z zasłoną odchodzącą (Horns Flare)', targetDefense: 'Strefa 2-3', description: 'Opis', diagramData: { steps: [] }, tags: ['strefa'] }
    });
    expect(await upgradePresetPlays({ play: { findMany: vi.fn(), update } }, [{ name: 'A' }])).toBe(0);
  });
});
