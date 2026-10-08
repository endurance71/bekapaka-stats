-- Sezony, w których zawodnik nie gra (ukryty w składzie sezonu)
ALTER TABLE "RosterPlayer" ADD COLUMN "inactiveSeasonIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
