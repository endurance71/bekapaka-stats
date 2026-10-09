-- Dane składu 2026/27 (decyzja klubu, 09.10.2026). Tylko dane, bez zmian schematu; idempotentne.
-- Marcin Trawiński nie gra w aktywnym sezonie → ukryty w składzie sezonu (historia meczów zostaje).
-- Na pustej bazie (CI, nowa instalacja) nic nie zmienia.
UPDATE "RosterPlayer"
SET "inactiveSeasonIds" = array_append("inactiveSeasonIds", s.id),
    "updatedAt" = CURRENT_TIMESTAMP
FROM (SELECT id FROM "KalkSeason" WHERE "isActive" = true ORDER BY id DESC LIMIT 1) s
WHERE "firstName" = 'Marcin' AND "lastName" = 'Trawiński'
  AND NOT (s.id = ANY("inactiveSeasonIds"));
