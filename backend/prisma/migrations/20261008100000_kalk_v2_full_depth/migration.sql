-- AlterTable
ALTER TABLE "KalkSeason" ADD COLUMN     "kalkNumber" INTEGER,
ADD COLUMN     "sourceSite" TEXT NOT NULL DEFAULT 'legacy';

-- AlterTable
ALTER TABLE "RosterPlayer" ADD COLUMN     "kalkSlug" TEXT;

-- AlterTable
ALTER TABLE "KalkPlayer" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "KalkTeam" ADD COLUMN     "captainSlug" TEXT,
ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "KalkMatch" ADD COLUMN     "commissioner" TEXT,
ADD COLUMN     "extras" JSONB,
ADD COLUMN     "hasPlayByPlay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "info" JSONB,
ADD COLUMN     "mvpEval" INTEGER,
ADD COLUMN     "mvpPlayerSlug" TEXT,
ADD COLUMN     "overtimes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parserVersion" TEXT,
ADD COLUMN     "refereeList" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "roundId" INTEGER,
ADD COLUMN     "roundLabel" TEXT,
ADD COLUMN     "roundNumber" INTEGER,
ADD COLUMN     "sectionHashes" JSONB,
ADD COLUMN     "sectionsAvailable" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sourceSite" TEXT NOT NULL DEFAULT 'legacy',
ADD COLUMN     "stageId" INTEGER,
ADD COLUMN     "stageLabel" TEXT,
ADD COLUMN     "startsAtUtc" TIMESTAMP(3),
ADD COLUMN     "venue" TEXT;

-- AlterTable
ALTER TABLE "KalkPlayerGameLog" ADD COLUMN     "ast" INTEGER,
ADD COLUMN     "blk" INTEGER,
ADD COLUMN     "blkAgainst" INTEGER,
ADD COLUMN     "drb" INTEGER,
ADD COLUMN     "eval" INTEGER,
ADD COLUMN     "fga" INTEGER,
ADD COLUMN     "fgm" INTEGER,
ADD COLUMN     "fta" INTEGER,
ADD COLUMN     "ftm" INTEGER,
ADD COLUMN     "number" INTEGER,
ADD COLUMN     "orb" INTEGER,
ADD COLUMN     "pf" INTEGER,
ADD COLUMN     "pfDrawn" INTEGER,
ADD COLUMN     "playerSlug" TEXT,
ADD COLUMN     "plusMinus" INTEGER,
ADD COLUMN     "pts" INTEGER,
ADD COLUMN     "reb" INTEGER,
ADD COLUMN     "secondsPlayed" INTEGER,
ADD COLUMN     "side" TEXT,
ADD COLUMN     "starter" BOOLEAN,
ADD COLUMN     "stl" INTEGER,
ADD COLUMN     "teamKalkId" TEXT,
ADD COLUMN     "threePa" INTEGER,
ADD COLUMN     "threePm" INTEGER,
ADD COLUMN     "tov" INTEGER,
ADD COLUMN     "twoPa" INTEGER,
ADD COLUMN     "twoPm" INTEGER;

-- AlterTable
ALTER TABLE "KalkSyncRun" ADD COLUMN     "counts" JSONB,
ADD COLUMN     "failures" JSONB,
ADD COLUMN     "httpCount" INTEGER,
ADD COLUMN     "manifest" JSONB,
ADD COLUMN     "parserVersion" TEXT,
ADD COLUMN     "requestBudget" INTEGER;

-- AlterTable
ALTER TABLE "LeagueMatch" ADD COLUMN     "guestRecordBefore" TEXT,
ADD COLUMN     "guestTeamKalkId" TEXT,
ADD COLUMN     "homeRecordBefore" TEXT,
ADD COLUMN     "homeTeamKalkId" TEXT,
ADD COLUMN     "roundId" INTEGER,
ADD COLUMN     "roundLabel" TEXT,
ADD COLUMN     "stageId" INTEGER,
ADD COLUMN     "venue" TEXT;

-- CreateTable
CREATE TABLE "KalkTeamGameStat" (
    "seasonId" TEXT NOT NULL,
    "kalkMatchId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "teamKalkId" TEXT,
    "teamName" TEXT NOT NULL,
    "opponentKalkId" TEXT,
    "opponentName" TEXT NOT NULL,
    "isWin" BOOLEAN,
    "pts" INTEGER NOT NULL,
    "ptsAgainst" INTEGER NOT NULL,
    "q1" INTEGER,
    "q2" INTEGER,
    "q3" INTEGER,
    "q4" INTEGER,
    "otPts" INTEGER,
    "minutesSec" INTEGER,
    "fgm" INTEGER NOT NULL,
    "fga" INTEGER NOT NULL,
    "twoPm" INTEGER NOT NULL,
    "twoPa" INTEGER NOT NULL,
    "threePm" INTEGER NOT NULL,
    "threePa" INTEGER NOT NULL,
    "ftm" INTEGER NOT NULL,
    "fta" INTEGER NOT NULL,
    "orb" INTEGER NOT NULL,
    "drb" INTEGER NOT NULL,
    "reb" INTEGER NOT NULL,
    "ast" INTEGER NOT NULL,
    "stl" INTEGER NOT NULL,
    "tov" INTEGER NOT NULL,
    "pf" INTEGER NOT NULL,
    "pfDrawn" INTEGER NOT NULL,
    "blk" INTEGER NOT NULL,
    "blkAgainst" INTEGER NOT NULL,
    "eval" INTEGER NOT NULL,
    "startersPts" INTEGER,
    "benchPts" INTEGER,
    "ptsOffTurnovers" INTEGER,
    "ptsInPaint" INTEGER,
    "secondChancePts" INTEGER,
    "fastBreakPts" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KalkTeamGameStat_pkey" PRIMARY KEY ("seasonId","kalkMatchId","side")
);

-- CreateTable
CREATE TABLE "KalkPlayByPlayEvent" (
    "seasonId" TEXT NOT NULL,
    "kalkMatchId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "clockSec" INTEGER,
    "elapsedSec" INTEGER,
    "side" TEXT,
    "teamKalkId" TEXT,
    "playerName" TEXT,
    "playerSlug" TEXT,
    "playerNumber" INTEGER,
    "actionRaw" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "shotValue" INTEGER,
    "made" BOOLEAN,
    "blocked" BOOLEAN,
    "reboundType" TEXT,
    "subOutNumber" INTEGER,
    "subOutSlug" TEXT,
    "scoreHome" INTEGER NOT NULL,
    "scoreAway" INTEGER NOT NULL,
    "isScoring" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "KalkPlayByPlayEvent_pkey" PRIMARY KEY ("seasonId","kalkMatchId","seq")
);

-- CreateTable
CREATE TABLE "KalkPlayerSeasonStat" (
    "seasonId" TEXT NOT NULL,
    "playerSlug" TEXT NOT NULL,
    "competition" TEXT NOT NULL,
    "teamKey" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamKalkId" TEXT,
    "games" INTEGER NOT NULL,
    "minutesTotal" INTEGER,
    "pts" INTEGER NOT NULL,
    "twoPm" INTEGER NOT NULL,
    "twoPa" INTEGER,
    "twoPct" DOUBLE PRECISION,
    "threePm" INTEGER NOT NULL,
    "threePa" INTEGER,
    "threePct" DOUBLE PRECISION,
    "ftm" INTEGER NOT NULL,
    "fta" INTEGER,
    "ftPct" DOUBLE PRECISION,
    "orb" INTEGER NOT NULL,
    "drb" INTEGER NOT NULL,
    "reb" INTEGER NOT NULL,
    "ast" INTEGER NOT NULL,
    "stl" INTEGER NOT NULL,
    "tov" INTEGER NOT NULL,
    "blk" INTEGER NOT NULL,
    "pf" INTEGER NOT NULL,
    "pfDrawn" INTEGER NOT NULL,
    "eval" INTEGER NOT NULL,
    "plusMinus" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KalkPlayerSeasonStat_pkey" PRIMARY KEY ("seasonId","playerSlug","competition","teamKey")
);

-- CreateTable
CREATE TABLE "KalkPlayerProfile" (
    "slug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "position" TEXT,
    "heightCm" INTEGER,
    "birthYear" INTEGER,
    "lastNumber" INTEGER,
    "otherCompetitions" JSONB,
    "career" JSONB,
    "profileHash" TEXT,
    "scrapedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KalkPlayerProfile_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "KalkTeamProfile" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sinceDate" TIMESTAMP(3),
    "captainSlug" TEXT,
    "allTimeGames" INTEGER,
    "allTimeWins" INTEGER,
    "allTimeLosses" INTEGER,
    "allTimePointsFor" INTEGER,
    "allTimePointsAgainst" INTEGER,
    "quartersWon" INTEGER,
    "quartersLost" INTEGER,
    "overtimes" INTEGER,
    "overtimeWins" INTEGER,
    "overtimeLosses" INTEGER,
    "history" JSONB,
    "scrapedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KalkTeamProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KalkMatchIdAlias" (
    "legacyId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "kalkMatchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KalkMatchIdAlias_pkey" PRIMARY KEY ("legacyId")
);

-- CreateIndex
CREATE INDEX "KalkTeamGameStat_seasonId_teamKalkId_idx" ON "KalkTeamGameStat"("seasonId", "teamKalkId");

-- CreateIndex
CREATE INDEX "KalkPlayByPlayEvent_seasonId_playerSlug_actionType_idx" ON "KalkPlayByPlayEvent"("seasonId", "playerSlug", "actionType");

-- CreateIndex
CREATE INDEX "KalkPlayerSeasonStat_seasonId_teamKalkId_idx" ON "KalkPlayerSeasonStat"("seasonId", "teamKalkId");

-- CreateIndex
CREATE INDEX "KalkMatchIdAlias_seasonId_kalkMatchId_idx" ON "KalkMatchIdAlias"("seasonId", "kalkMatchId");

-- CreateIndex
CREATE UNIQUE INDEX "KalkSeason_kalkNumber_key" ON "KalkSeason"("kalkNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RosterPlayer_kalkSlug_key" ON "RosterPlayer"("kalkSlug");

-- CreateIndex
CREATE INDEX "KalkPlayer_seasonId_slug_idx" ON "KalkPlayer"("seasonId", "slug");

-- CreateIndex
CREATE INDEX "KalkMatch_seasonId_date_idx" ON "KalkMatch"("seasonId", "date");

-- CreateIndex
CREATE INDEX "KalkMatch_seasonId_homeTeamId_idx" ON "KalkMatch"("seasonId", "homeTeamId");

-- CreateIndex
CREATE INDEX "KalkMatch_seasonId_guestTeamId_idx" ON "KalkMatch"("seasonId", "guestTeamId");

-- CreateIndex
CREATE INDEX "KalkPlayerGameLog_seasonId_playerSlug_idx" ON "KalkPlayerGameLog"("seasonId", "playerSlug");

-- CreateIndex
CREATE INDEX "KalkPlayerGameLog_seasonId_kalkMatchId_idx" ON "KalkPlayerGameLog"("seasonId", "kalkMatchId");

-- AddForeignKey
ALTER TABLE "KalkTeamGameStat" ADD CONSTRAINT "KalkTeamGameStat_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KalkTeamGameStat" ADD CONSTRAINT "KalkTeamGameStat_seasonId_kalkMatchId_fkey" FOREIGN KEY ("seasonId", "kalkMatchId") REFERENCES "KalkMatch"("seasonId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KalkPlayByPlayEvent" ADD CONSTRAINT "KalkPlayByPlayEvent_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KalkPlayByPlayEvent" ADD CONSTRAINT "KalkPlayByPlayEvent_seasonId_kalkMatchId_fkey" FOREIGN KEY ("seasonId", "kalkMatchId") REFERENCES "KalkMatch"("seasonId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KalkPlayerSeasonStat" ADD CONSTRAINT "KalkPlayerSeasonStat_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Numery sezonów na kalk-koszalin.com (`?sezon=`) dla istniejących sezonów
UPDATE "KalkSeason" SET "kalkNumber" = 49 WHERE "slug" = '2025-2026' AND "kalkNumber" IS NULL;
UPDATE "KalkSeason" SET "kalkNumber" = 50, "sourceSite" = 'v2' WHERE "slug" = '2026-2027' AND "kalkNumber" IS NULL;
