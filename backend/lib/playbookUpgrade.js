/**
 * Zagrywki z presetów zapisane w bazie pod starą (angielską) nazwą → aktualna, polska wersja presetu.
 * Dopasowanie po `legacyName`; zagrywki z generatora AI i dodane ręcznie zostają bez zmian. Idempotentne.
 * @param {{ play: { findMany: Function, update: Function } }} prisma
 * @param {Array<{ name: string, legacyName?: string, targetDefense?: string, description?: string, diagramData?: unknown, tags?: string[] }>} presets
 * @returns {Promise<number>} liczba zaktualizowanych zagrywek
 */
export async function upgradePresetPlays(prisma, presets) {
  const byLegacy = new Map(
    presets.filter((p) => p.legacyName && p.legacyName !== p.name).map((p) => [p.legacyName, p])
  );
  if (!byLegacy.size) return 0;
  const rows = (await prisma.play.findMany({
    where: { name: { in: [...byLegacy.keys()] }, isAiGenerated: false },
    select: { id: true, name: true }
  })) || [];
  for (const row of rows) {
    const preset = byLegacy.get(row.name);
    await prisma.play.update({
      where: { id: row.id },
      data: {
        name: preset.name,
        targetDefense: preset.targetDefense ?? null,
        description: preset.description ?? null,
        diagramData: preset.diagramData ?? null,
        tags: preset.tags || []
      }
    });
  }
  return rows.length;
}
