# Model danych

## Mecz
```json
{
  "id": "game-2026-01-18",
  "league": "...",
  "opponent": "Grubik Team",
  "date": "2026-01-18",
  "time": "20:30",
  "venue": "Hala Bobolice",
  "homeAway": "home",
  "finalScore": "Grubik Team 77 – 60 BeKaPaKa Bobolice",
  "quarters": [{ "label": "Q1", "home": 12, "away": 15 }],
  "fiveMinute": [{ "label": "0-5", "home": 6, "away": 8, "lead": -2 }],
  "runs": {
    "home": ["8-0"],
    "away": ["10-0"],
    "leadChanges": 6,
    "ties": 4,
    "timeLeadingHome": "08:12",
    "timeLeadingAway": "29:43"
  },
  "teamStats": {
    "pointsOffTov": { "home": 8, "away": 14 },
    "pointsInPaint": { "home": 24, "away": 30 },
    "secondChance": { "home": 10, "away": 12 },
    "fastBreak": { "home": 6, "away": 11 },
    "benchPoints": { "home": 14, "away": 22 }
  },
  "tags": ["back-to-back"],
  "coachNotes": "...",
  "teams": [
    {
      "id": "team-bekapaka",
      "name": "BeKaPaKa Bobolice",
      "isBekapaka": true,
      "isHome": true,
      "fourFactors": { "efg": 0.44, "tovPct": 0.18, "orbPct": 0.29, "ftRate": 0.28 },
      "players": [{ "id": "p1", "name": "Kamil Nowak", "min": "31:20", "fgm": 4, "fga": 12, "pts": 13 }]
    }
  ]
}
```

## Zawodnik (roster)
```json
{
  "id": "p1",
  "firstName": "Kamil",
  "lastName": "Nowak",
  "number": 7,
  "position": "PG",
  "starter": true,
  "ppg": 12.4,
  "rpg": 3.1,
  "apg": 5.8,
  "efg": 0.46,
  "ts": 0.52,
  "plusMinus": 4.2
}
```

## Import JSON
```json
{
  "game": { "id": "game-2026-01-18", "teams": [] }
}
```

## Import Markdown
- Tabele w formacie Markdown (pipe tables)
- Kolumny mapowane do pól statystycznych (np. "C/W" => `fgm`, `fga`)
