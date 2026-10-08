-- Dzień meczowy w terminarzu (zbiórka, strój, uwagi trenera) — addytywnie, bez zmian istniejących danych
ALTER TABLE "LeagueMatch" ADD COLUMN "matchDay" JSONB;
ALTER TABLE "LeagueMatch" ADD COLUMN "matchDayUpdatedAt" TIMESTAMP(3);
