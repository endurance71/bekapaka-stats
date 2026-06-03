-- KALK-only data model: teams, matches, player game logs, sync metadata

-- AlterTable KalkPlayer
ALTER TABLE "KalkPlayer" ADD COLUMN IF NOT EXISTS "turnoversTotal" DOUBLE PRECISION;
ALTER TABLE "KalkPlayer" ADD COLUMN IF NOT EXISTS "turnoversAverage" DOUBLE PRECISION;
ALTER TABLE "KalkPlayer" ADD COLUMN IF NOT EXISTS "foulsTotal" DOUBLE PRECISION;
ALTER TABLE "KalkPlayer" ADD COLUMN IF NOT EXISTS "foulsAverage" DOUBLE PRECISION;
ALTER TABLE "KalkPlayer" ADD COLUMN IF NOT EXISTS "minutesTotal" DOUBLE PRECISION;
ALTER TABLE "KalkPlayer" ADD COLUMN IF NOT EXISTS "minutesAverage" DOUBLE PRECISION;
ALTER TABLE "KalkPlayer" ADD COLUMN IF NOT EXISTS "twoPointsPct" DOUBLE PRECISION;
ALTER TABLE "KalkPlayer" ADD COLUMN IF NOT EXISTS "ftPct" DOUBLE PRECISION;
ALTER TABLE "KalkPlayer" ADD COLUMN IF NOT EXISTS "attackIndex" DOUBLE PRECISION;
ALTER TABLE "KalkPlayer" ADD COLUMN IF NOT EXISTS "defenseIndex" DOUBLE PRECISION;

-- AlterTable LeagueMatch
ALTER TABLE "LeagueMatch" ADD COLUMN IF NOT EXISTS "kalkMatchId" TEXT;
ALTER TABLE "LeagueMatch" ADD COLUMN IF NOT EXISTS "roundUrl" TEXT;
ALTER TABLE "LeagueMatch" ADD COLUMN IF NOT EXISTS "phaseLabel" TEXT;
CREATE INDEX IF NOT EXISTS "LeagueMatch_seasonId_kalkMatchId_idx" ON "LeagueMatch"("seasonId", "kalkMatchId");

-- CreateTable KalkTeam
CREATE TABLE IF NOT EXISTS "KalkTeam" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "captain" TEXT,
    "colors" TEXT,
    "sponsors" TEXT,
    "profileUrl" TEXT,
    "playerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KalkTeam_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "KalkTeam_seasonId_id_key" ON "KalkTeam"("seasonId", "id");

ALTER TABLE "KalkTeam" DROP CONSTRAINT IF EXISTS "KalkTeam_seasonId_fkey";
ALTER TABLE "KalkTeam" ADD CONSTRAINT "KalkTeam_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable KalkMatch
CREATE TABLE IF NOT EXISTS "KalkMatch" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "roundCode" TEXT,
    "matchNumber" INTEGER,
    "homeTeamId" TEXT,
    "guestTeamId" TEXT,
    "homeTeamName" TEXT NOT NULL,
    "guestTeamName" TEXT NOT NULL,
    "scoreHome" INTEGER,
    "scoreAway" INTEGER,
    "isFinished" BOOLEAN NOT NULL DEFAULT false,
    "referees" TEXT,
    "statistician" TEXT,
    "boxScore" JSONB NOT NULL,
    "meta" JSONB,
    "contentHash" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiSummary" TEXT,
    "aiSummaryAt" TIMESTAMP(3),
    "aiSummaryModel" TEXT,
    "aiSummaryHash" TEXT,

    CONSTRAINT "KalkMatch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "KalkMatch" ADD COLUMN IF NOT EXISTS "aiSummary" TEXT;
ALTER TABLE "KalkMatch" ADD COLUMN IF NOT EXISTS "aiSummaryAt" TIMESTAMP(3);
ALTER TABLE "KalkMatch" ADD COLUMN IF NOT EXISTS "aiSummaryModel" TEXT;
ALTER TABLE "KalkMatch" ADD COLUMN IF NOT EXISTS "aiSummaryHash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "KalkMatch_seasonId_id_key" ON "KalkMatch"("seasonId", "id");

ALTER TABLE "KalkMatch" DROP CONSTRAINT IF EXISTS "KalkMatch_seasonId_fkey";
ALTER TABLE "KalkMatch" ADD CONSTRAINT "KalkMatch_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable KalkPlayerGameLog
CREATE TABLE IF NOT EXISTS "KalkPlayerGameLog" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "kalkPlayerId" TEXT NOT NULL,
    "kalkMatchId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "opponentName" TEXT NOT NULL,
    "isWin" BOOLEAN,
    "stats" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KalkPlayerGameLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "KalkPlayerGameLog_seasonId_kalkPlayerId_kalkMatchId_key" ON "KalkPlayerGameLog"("seasonId", "kalkPlayerId", "kalkMatchId");

ALTER TABLE "KalkPlayerGameLog" DROP CONSTRAINT IF EXISTS "KalkPlayerGameLog_seasonId_fkey";
ALTER TABLE "KalkPlayerGameLog" ADD CONSTRAINT "KalkPlayerGameLog_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KalkPlayerGameLog" DROP CONSTRAINT IF EXISTS "KalkPlayerGameLog_kalkPlayerId_fkey";
ALTER TABLE "KalkPlayerGameLog" ADD CONSTRAINT "KalkPlayerGameLog_kalkPlayerId_fkey" FOREIGN KEY ("kalkPlayerId") REFERENCES "KalkPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KalkPlayerGameLog" DROP CONSTRAINT IF EXISTS "KalkPlayerGameLog_seasonId_kalkMatchId_fkey";
ALTER TABLE "KalkPlayerGameLog" ADD CONSTRAINT "KalkPlayerGameLog_seasonId_kalkMatchId_fkey" FOREIGN KEY ("seasonId", "kalkMatchId") REFERENCES "KalkMatch"("seasonId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable KalkSyncRun
CREATE TABLE IF NOT EXISTS "KalkSyncRun" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT,
    "mode" TEXT NOT NULL,
    "trigger" TEXT,
    "status" TEXT NOT NULL,
    "httpEstimate" INTEGER,
    "sectionsChanged" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "probeHashes" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "KalkSyncRun_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "KalkSyncRun" DROP CONSTRAINT IF EXISTS "KalkSyncRun_seasonId_fkey";
ALTER TABLE "KalkSyncRun" ADD CONSTRAINT "KalkSyncRun_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable KalkSectionSnapshot
CREATE TABLE IF NOT EXISTS "KalkSectionSnapshot" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KalkSectionSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "KalkSectionSnapshot_seasonId_section_key" ON "KalkSectionSnapshot"("seasonId", "section");

ALTER TABLE "KalkSectionSnapshot" DROP CONSTRAINT IF EXISTS "KalkSectionSnapshot_seasonId_fkey";
ALTER TABLE "KalkSectionSnapshot" ADD CONSTRAINT "KalkSectionSnapshot_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;
