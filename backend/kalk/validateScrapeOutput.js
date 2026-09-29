export function validateScrapeOutput(stats, previousMtimeMs, currentMtimeMs, expectedSeasonSlug) {
  if (!Number.isFinite(currentMtimeMs) || (Number.isFinite(previousMtimeMs) && currentMtimeMs <= previousMtimeMs)) {
    throw new Error('Scraper nie zapisał nowego pliku kalk_stats.json; import przerwany.');
  }
  if (stats?.version !== 2 || !Array.isArray(stats.table) || stats.table.length === 0 || !Array.isArray(stats.schedule) || stats.schedule.length === 0) {
    throw new Error('Wynik KALK jest pusty lub niekompletny; import przerwany.');
  }
  if (!expectedSeasonSlug || stats.scrapeManifest?.seasonSlug !== expectedSeasonSlug) {
    throw new Error('Wynik KALK dotyczy innego sezonu; import przerwany.');
  }
}
