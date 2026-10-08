-- Dane składu 2026/27 (decyzja klubu, 08.10.2026). Tylko dane, bez zmian schematu; idempotentne.
-- Na pustej bazie (CI, nowa instalacja) nic nie zmienia.

-- 1. Łukasz Gośniak i Filip Kawecki nie grają w aktywnym sezonie → ukryci w składzie sezonu
UPDATE "RosterPlayer"
SET "inactiveSeasonIds" = array_append("inactiveSeasonIds", s.id),
    "updatedAt" = CURRENT_TIMESTAMP
FROM (SELECT id FROM "KalkSeason" WHERE "isActive" = true ORDER BY id DESC LIMIT 1) s
WHERE (("firstName" = 'Łukasz' AND "lastName" = 'Gośniak') OR ("firstName" = 'Filip' AND "lastName" = 'Kawecki'))
  AND NOT (s.id = ANY("inactiveSeasonIds"));

-- 2. Pablo Iriarte: powiązanie z KALK (35 meczów w BeKaPaKa 2023–2026; bez meczu w bieżącym sezonie sync go pomijał)
UPDATE "RosterPlayer" r
SET "kalkSlug" = 'pablo-iriarte',
    "kalkPlayerId" = COALESCE(
      (SELECT kp.id FROM "KalkPlayer" kp
        WHERE kp.id = '2025-2026__pablo-iriarte'
          AND NOT EXISTS (SELECT 1 FROM "RosterPlayer" o WHERE o."kalkPlayerId" = kp.id)),
      r."kalkPlayerId"),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE r."firstName" = 'Pablo' AND r."lastName" = 'Iriarte'
  AND r."kalkSlug" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "RosterPlayer" o WHERE o."kalkSlug" = 'pablo-iriarte');
