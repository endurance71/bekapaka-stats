# Kontrakt KALK v2: skraper (Python) → import (Node)

`backend/scripts/kalk_sync.py` zapisuje jeden plik JSON na sezon i run (`/data/kalk/runs/{runId}-{seasonSlug}.json` lub `--output`). Import: `backend/kalk/v2/ingestSeason.js`. Wszystkie liczby to liczby (nie stringi); brak danych = `null`; daty ISO 8601 UTC.

```jsonc
{
  "version": 3,
  "manifest": {
    "runId": "20261008T093000Z-ab12",
    "parserVersion": "4.0.0",
    "sourceSite": "v2",
    "seasonSlug": "2026-2027",          // z etykiety sezonu "2026/2027"
    "seasonLabel": "2026/2027",
    "kalkNumber": 50,                   // ?sezon=
    "league": "dywizja-ii",
    "mode": "full",                     // full | incremental
    "sections": ["league","schedule","matches","pbp","players","profiles","teams"],
    "httpCount": 123, "requestBudget": 600, "truncated": false,
    "counts": { "matchesNew": 0, "matchesUpdated": 0, "matchesUnchanged": 0, "matchesFailed": 0, "players": 0, "profiles": 0, "teams": 0 },
    "failures": [ { "url": "https://…", "section": "matches", "kalkMatchId": "4124", "error": "…" } ],
    "startedAt": "…", "finishedAt": "…"
  },

  "standings": [ { "position": 1, "teamKalkId": "147", "name": "BrdCrew", "logoUrl": null,
                   "matches": 1, "wins": 1, "losses": 0, "pointsFor": 64, "pointsAgainst": 46, "points": 2,
                   "form": ["W"], "streak": "W1" } ],

  "teams": [ { "id": "138", "slug": "bekapaka-bobolice", "name": "BeKaPaKa Bobolice", "profileUrl": "https://…",
               "logoUrl": null, "playerSlugs": ["filip-karpinski"] } ],

  "schedule": [ {
    "kalkMatchId": "4124", "url": "https://www.kalk-koszalin.com/mecz/4124",
    "stageId": 361, "stageLabel": "Sezon zasadniczy", "roundId": 1234, "roundLabel": "Kolejka - 3", "roundNumber": 3,
    "startsAtUtc": "2026-10-04T10:00:00Z", "venue": "ZOS - KOSiR",
    "homeTeamKalkId": "138", "homeTeam": "BeKaPaKa Bobolice", "guestTeamKalkId": "148", "guestTeam": "Kosz-All-In",
    "scoreHome": 86, "scoreAway": 20, "isFinished": true,
    "homeRecordBefore": "0–0", "guestRecordBefore": null
  } ],

  "matches": [ {
    "kalkMatchId": "4124", "sectionHashes": { "info": "sha256…", "box": "sha256…", "pbp": "sha256…" },
    "sectionsAvailable": ["info","statystyki","akcja-po-akcji"],
    "info": {
      "stageLabel": "Sezon zasadniczy", "roundLabel": "Kolejka - 3", "startsAtUtc": "…", "venue": "ZOS - KOSiR", "city": "Koszalin",
      "quarters": [ { "period": 1, "label": "Kw. 1", "home": 26, "away": 4 } ],   // OT: period 5+, label "OT 1"
      "overtimes": 0,
      "flow5": [ { "minute": 5, "home": 13, "away": 2 } ],
      "leaders": { "eval": [ { "slug": "…", "name": "…", "teamKalkId": "…", "value": 36 } ], "pts": [], "reb": [], "ast": [] },
      "mvp": { "slug": "filip-karpinski", "name": "Filip Karpiński", "number": 69, "eval": 36 } ,
      "referees": ["Jan Kowalski"], "commissioner": null,
      "pointsSources": { "home": { "ptsOffTurnovers": 12, "ptsInPaint": 0, "secondChancePts": 11, "fastBreakPts": 18 }, "away": { } } // null gdy brak PBP
    },
    "box": {
      "teams": [ {
        "side": "home", "teamKalkId": "138", "name": "BeKaPaKa Bobolice",
        "players": [ { "slug": "dawid-olearczyk", "name": "D. Olearczyk", "number": 1, "starter": true,
                       "secondsPlayed": 1432, "pts": 12, "twoPm": 4, "twoPa": 5, "threePm": 0, "threePa": 0, "fgm": 4, "fga": 5,
                       "ftm": 4, "fta": 6, "orb": 3, "drb": 0, "reb": 3, "ast": 11, "stl": 2, "tov": 1, "pf": 1, "pfDrawn": 0,
                       "blk": 0, "blkAgainst": 0, "eval": 24, "plusMinus": 0 } ],
        "totals": { "secondsPlayed": 12060, "pts": 86, "twoPm": 0, "twoPa": 0, "threePm": 0, "threePa": 0, "fgm": 0, "fga": 0,
                    "ftm": 0, "fta": 0, "orb": 0, "drb": 0, "reb": 0, "ast": 0, "stl": 0, "tov": 0, "pf": 0, "pfDrawn": 0,
                    "blk": 0, "blkAgainst": 0, "eval": 0 },
        "startersPts": 58, "benchPts": 28
      } ]                                   // dokładnie 2 elementy: home, away
    },
    "pbp": {                                // null, gdy mecz nie ma akcji po akcji
      "events": [ { "seq": 1, "period": 1, "clockSec": 600, "elapsedSec": 0, "side": "home", "teamKalkId": "138",
                    "playerName": "Alan Niwiński", "playerSlug": "alan-niwinski", "playerNumber": 27,
                    "actionRaw": "Celny rzut za 2", "actionType": "shot_made", "shotValue": 2, "made": true, "blocked": false,
                    "reboundType": null, "subOutNumber": null, "subOutSlug": null,
                    "scoreHome": 2, "scoreAway": 0, "isScoring": true } ],
      "unresolvedNames": 0
    },
    "extras": null
  } ],

  "players": [ {                            // każdy zawodnik ligi w sezonie (katalog + zawodnicy z box score)
    "slug": "filip-karpinski", "fullName": "Filip Karpiński", "teamKalkId": "138", "teamName": "BeKaPaKa Bobolice",
    "number": 69, "profileUrl": "https://…",
    "seasonStats": [ { "competition": "Dywizja II", "teamName": "BeKaPaKa Bobolice", "teamKalkId": "138",
                       "games": 1, "minutesTotal": 1637, "pts": 28, "twoPm": 13, "twoPct": 86.7, "threePm": 0, "threePct": null,
                       "ftm": 2, "ftPct": 50.0, "orb": 2, "drb": 4, "reb": 6, "ast": 4, "stl": 0, "tov": 2, "blk": 0,
                       "pf": 1, "pfDrawn": 3, "eval": 36, "plusMinus": 0 } ]   // tylko wiersze tego sezonu
  } ],

  "profiles": [ { "slug": "filip-karpinski", "fullName": "Filip Karpiński", "firstName": "Filip", "lastName": "Karpiński",
                  "position": "SF", "heightCm": 185, "birthYear": null, "lastNumber": 69,
                  "otherCompetitions": [ /* wiersze statystyk spoza Dywizji II / innych sezonów */ ] } ],

  "teamProfiles": [ { "id": "138", "slug": "bekapaka-bobolice", "name": "BeKaPaKa Bobolice", "sinceDate": "2023-10-08",
                      "captainSlug": "przemyslaw-klimek", "allTimeGames": 50, "allTimeWins": 13, "allTimeLosses": 37,
                      "allTimePointsFor": 2561, "allTimePointsAgainst": 3273, "quartersWon": 57, "quartersLost": 127,
                      "overtimes": 4, "overtimeWins": 1, "overtimeLosses": 3 } ]
}
```

## `actionType`
`shot_made`, `shot_missed`, `shot_blocked` (rzut za 2/3; `shotValue` 2|3), `ft_made`, `ft_missed` (`shotValue` 1), `rebound` (`reboundType` `O`|`D`|`TEAM`, wyznaczony z kontekstu: zbiórka tej samej strony co ostatni niecelny rzut = `O`), `assist`, `turnover`, `steal`, `foul`, `block`, `timeout`, `sub` (`subOutNumber/subOutSlug` = schodzący, `player*` = wchodzący; `#-2` = skład wyjściowy, `subOut*` null), `on_court`, `period_start`, `period_end`, `unknown`.

## Inwarianty (weryfikowane w `validate.py` przed zapisem i w audycie Node)
- Σ `pts` zawodników = `totals.pts` = wynik z terminarza; `totals` = Σ wierszy (każda kolumna).
- Zawodnik i drużyna: `fgm = twoPm + threePm`, `fga = twoPa + threePa`, `pts = 2·twoPm + 3·threePm + ftm`, `reb = orb + drb`, trafione ≤ oddane.
- Σ kwart = wynik; OT tylko przy remisie po 4. kwarcie.
- PBP: ostatni wynik = wynik końcowy; wynik nie maleje; Σ punktów ze zdarzeń po stronie = wynik.
- Mecz łamiący inwariant **nie trafia** do `matches` — idzie do `manifest.failures`.

## Tożsamość
- Zawodnik: `slug` z linku `/zawodnik/{slug}` (stały między sezonami). `KalkPlayer.id = "{seasonSlug}__{slug}"`.
- Drużyna: ID KALK (`/druzyna/{id}/…`), nazwy mogą się zmieniać („Drużyna archiwalna #NNN”).
- Mecz: `kalkMatchId` (globalny w KALK v2).
