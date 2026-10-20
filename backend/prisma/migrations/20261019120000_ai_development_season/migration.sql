-- Sezon, dla którego wygenerowano plan rozwoju (przy <3 meczach w aktywnym sezonie plan pochodzi z poprzedniego). Additive only.
ALTER TABLE "RosterPlayer" ADD COLUMN "aiDevelopmentSeasonId" TEXT;

-- Backfill: wszystkie zapisane plany (2026-10-14 i 2026-10-19) powstały dla sezonu 2025/26.
UPDATE "RosterPlayer"
SET "aiDevelopmentSeasonId" = 'season_2025-2026'
WHERE "aiDevelopmentSummary" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "KalkSeason" WHERE "id" = 'season_2025-2026');
