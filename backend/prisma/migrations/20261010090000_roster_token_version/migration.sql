-- Wersja tokenu sesji (unieważnianie po zmianie hasła)
ALTER TABLE "RosterPlayer" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
