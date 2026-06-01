-- Sezony KALK + archiwum ligowe i preferencje zawodników

CREATE TABLE "KalkSeason" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "divisionPath" TEXT NOT NULL DEFAULT 'dzial,dywizja-2,4.html',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KalkSeason_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KalkSeason_slug_key" ON "KalkSeason"("slug");

INSERT INTO "KalkSeason" ("id", "slug", "label", "divisionPath", "isActive", "startsAt", "endsAt", "updatedAt")
VALUES (
    'season_2025-2026',
    '2025-2026',
    'Sezon 2025/2026',
    'dzial,dywizja-2,4.html',
    true,
    '2025-09-01 00:00:00',
    '2026-08-31 23:59:59',
    CURRENT_TIMESTAMP
);

-- Game.seasonId
ALTER TABLE "Game" ADD COLUMN "seasonId" TEXT;
ALTER TABLE "Game" ADD CONSTRAINT "Game_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "Game"
SET "seasonId" = 'season_2025-2026'
WHERE "date" >= '2025-09-01' AND "date" <= '2026-08-31 23:59:59';

UPDATE "Game"
SET "seasonId" = 'season_2025-2026'
WHERE "seasonId" IS NULL;

-- LeagueTeam.seasonId
ALTER TABLE "LeagueTeam" ADD COLUMN "seasonId" TEXT;

UPDATE "LeagueTeam" SET "seasonId" = 'season_2025-2026' WHERE "seasonId" IS NULL;

ALTER TABLE "LeagueTeam" ALTER COLUMN "seasonId" SET NOT NULL;
ALTER TABLE "LeagueTeam" ADD CONSTRAINT "LeagueTeam_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "LeagueTeam_name_phase_key";
CREATE UNIQUE INDEX "LeagueTeam_seasonId_name_phase_key" ON "LeagueTeam"("seasonId", "name", "phase");

-- LeagueMatch.seasonId
ALTER TABLE "LeagueMatch" ADD COLUMN "seasonId" TEXT;

UPDATE "LeagueMatch" SET "seasonId" = 'season_2025-2026' WHERE "seasonId" IS NULL;

ALTER TABLE "LeagueMatch" ALTER COLUMN "seasonId" SET NOT NULL;
ALTER TABLE "LeagueMatch" ADD CONSTRAINT "LeagueMatch_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- KalkPlayer.seasonId + prefiks id sezonu
ALTER TABLE "KalkPlayer" ADD COLUMN "seasonId" TEXT;

UPDATE "KalkPlayer" SET "seasonId" = 'season_2025-2026' WHERE "seasonId" IS NULL;

UPDATE "KalkPlayer"
SET "id" = '2025-2026__' || "id"
WHERE "id" NOT LIKE '%__%' AND "seasonId" = 'season_2025-2026';

UPDATE "RosterPlayer" rp
SET "kalkPlayerId" = '2025-2026__' || rp."kalkPlayerId"
WHERE rp."kalkPlayerId" IS NOT NULL
  AND rp."kalkPlayerId" NOT LIKE '%__%';

ALTER TABLE "KalkPlayer" ALTER COLUMN "seasonId" SET NOT NULL;
ALTER TABLE "KalkPlayer" ADD CONSTRAINT "KalkPlayer_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PlayerSeasonPreference
CREATE TABLE "PlayerSeasonPreference" (
    "rosterPlayerId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerSeasonPreference_pkey" PRIMARY KEY ("rosterPlayerId")
);

ALTER TABLE "PlayerSeasonPreference" ADD CONSTRAINT "PlayerSeasonPreference_rosterPlayerId_fkey" FOREIGN KEY ("rosterPlayerId") REFERENCES "RosterPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerSeasonPreference" ADD CONSTRAINT "PlayerSeasonPreference_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;
