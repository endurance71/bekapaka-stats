-- The following season migration indexes LeagueTeam.phase, which was
-- previously introduced by db push but omitted from migration history.
ALTER TABLE "LeagueTeam" ADD COLUMN IF NOT EXISTS "phase" TEXT NOT NULL DEFAULT 'regular';
