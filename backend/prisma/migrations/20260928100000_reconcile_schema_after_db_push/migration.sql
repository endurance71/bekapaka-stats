-- Reconcile changes previously applied with `prisma db push`. The IF EXISTS
-- guards make this migration safe for databases that already have the fields.

DROP INDEX IF EXISTS "LeagueTeam_name_key";
ALTER TABLE "KalkMatch" DROP CONSTRAINT IF EXISTS "KalkMatch_pkey";
ALTER TABLE "KalkTeam" DROP CONSTRAINT IF EXISTS "KalkTeam_pkey";

ALTER TABLE "KalkPlayer"
  ADD COLUMN IF NOT EXISTS "assistsAverage" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "assistsTotal" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "blocksAverage" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "blocksTotal" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "reboundsAverage" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "reboundsTotal" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "stealsAverage" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "stealsTotal" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "threePointsAttempted" INTEGER,
  ADD COLUMN IF NOT EXISTS "threePointsMade" INTEGER,
  ADD COLUMN IF NOT EXISTS "threePointsPct" DOUBLE PRECISION;

ALTER TABLE "Play"
  ADD COLUMN IF NOT EXISTS "diagramData" JSONB,
  ADD COLUMN IF NOT EXISTS "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "targetDefense" TEXT;

-- Retain legacy diagram text before removing its old column. JSON strings are
-- preserved as strings rather than discarded if their format is unknown.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'Play' AND column_name = 'diagram'
  ) THEN
    UPDATE "Play" SET "diagramData" = to_jsonb("diagram")
      WHERE "diagramData" IS NULL AND "diagram" IS NOT NULL;
    ALTER TABLE "Play" DROP COLUMN "diagram";
  END IF;
END $$;

ALTER TABLE "Play" ALTER COLUMN "category" SET DEFAULT 'half_court';

ALTER TABLE "RosterPlayer"
  ADD COLUMN IF NOT EXISTS "password" TEXT,
  ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS "username" TEXT;

CREATE TABLE IF NOT EXISTS "LoginLog" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "ipAddress" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PreGameBriefing" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "opponentName" TEXT NOT NULL,
  "matchDate" TIMESTAMP(3),
  "gatheringTime" TEXT,
  "tipoffTime" TEXT,
  "jerseyColor" TEXT NOT NULL DEFAULT 'Czarne',
  "venue" TEXT NOT NULL DEFAULT 'Hala Sportowa, Bobolice',
  "tacticalKeys" JSONB NOT NULL,
  "startingFive" JSONB NOT NULL,
  "benchKeys" TEXT,
  "generatedByAi" BOOLEAN NOT NULL DEFAULT true,
  "model" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PreGameBriefing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PreGameBriefing_seasonId_opponentName_key"
  ON "PreGameBriefing"("seasonId", "opponentName");
CREATE UNIQUE INDEX IF NOT EXISTS "RosterPlayer_username_key"
  ON "RosterPlayer"("username");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PreGameBriefing_seasonId_fkey'
  ) THEN
    ALTER TABLE "PreGameBriefing" ADD CONSTRAINT "PreGameBriefing_seasonId_fkey"
      FOREIGN KEY ("seasonId") REFERENCES "KalkSeason"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
