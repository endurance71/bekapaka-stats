import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const roster = [
  { id: 'bk1', firstName: 'Damian', lastName: 'Motyliński', number: 24, position: 'SF', heightCm: 185, starter: true },
  { id: 'bk2', firstName: 'Filip', lastName: 'Kawecki', number: 77, position: 'SG', heightCm: 190, starter: true },
  { id: 'bk3', firstName: 'Filip', lastName: 'Karpiński', number: 69, position: 'C', heightCm: 198, starter: true },
  { id: 'bk4', firstName: 'Łukasz', lastName: 'Gośniak', number: 34, position: 'PG', heightCm: 187, starter: true },
  { id: 'bk5', firstName: 'Tomasz', lastName: 'Kaszubowski', number: 12, position: 'SG', heightCm: 183, starter: true },
  { id: 'bk6', firstName: 'Jędrzej', lastName: 'Bortnik', number: 2, position: 'SF', heightCm: 180, starter: false },
  { id: 'bk7', firstName: 'Emil', lastName: 'Kłos', number: 23, position: 'C', heightCm: 199, starter: false },
  { id: 'bk8', firstName: 'Robert', lastName: 'Kulik', number: 21, position: 'C', heightCm: 191, starter: false },
  { id: 'bk9', firstName: 'Przemysław', lastName: 'Klimek', number: 16, position: 'PF', heightCm: 183, starter: false },
  { id: 'bk10', firstName: 'Paweł', lastName: 'Samusionek', number: 3, position: 'PG', heightCm: 180, starter: false }
];

function withRosterStats(player, idx) {
  const ppg = 6 + (idx % 5) * 2;
  const rpg = 2 + (idx % 4);
  const apg = 1 + (idx % 3);
  const efg = 0.38 + (idx % 4) * 0.05;
  const ts = 0.44 + (idx % 4) * 0.04;
  const plusMinus = idx % 2 === 0 ? 4 : -3;
  return { ...player, ppg, rpg, apg, efg, ts, plusMinus };
}

const opponents = [
  'Pantery',
  'Grubik Team',
  'BrdCrew',
  'Młode Wilki',
  'Politechnika'
];

function makePlayerStats(player, idx) {
  const fga = 6 + (idx % 5);
  const fgm = Math.max(1, Math.floor(fga * (0.35 + (idx % 3) * 0.05)));
  const threePa = Math.floor(fga * 0.4);
  const threePm = Math.min(threePa, Math.floor(threePa * 0.33));
  const twoPa = fga - threePa;
  const twoPm = fgm - threePm;
  const fta = idx % 3;
  const ftm = Math.min(fta, Math.floor(fta * 0.7));
  const pts = twoPm * 2 + threePm * 3 + ftm;
  return {
    id: player.id,
    name: `${player.firstName} ${player.lastName}`,
    min: `2${idx % 4}:1${idx % 6}`,
    fgm,
    fga,
    two_pm: twoPm,
    two_pa: twoPa,
    three_pm: threePm,
    three_pa: threePa,
    ftm,
    fta,
    oreb: idx % 2,
    dreb: 2 + (idx % 4),
    reb: 2 + (idx % 4) + (idx % 2),
    ast: idx % 5,
    tov: idx % 3,
    stl: idx % 2,
    blk: idx % 2,
    pf: 1 + (idx % 3),
    fouls_committed: 1 + (idx % 2),
    fouls_drawn: idx % 3,
    plusMinus: (idx % 2 === 0 ? 4 : -3),
    pts
  };
}

function makeOpponentPlayers(namePrefix) {
  return Array.from({ length: 8 }).map((_, idx) => ({
    id: `${namePrefix}-${idx + 1}`,
    name: `${namePrefix} ${idx + 1}`,
    min: `2${idx % 4}:0${idx}`,
    fgm: 3 + (idx % 3),
    fga: 8 + (idx % 5),
    two_pm: 2 + (idx % 2),
    two_pa: 5 + (idx % 3),
    three_pm: 1 + (idx % 2),
    three_pa: 3 + (idx % 3),
    ftm: idx % 3,
    fta: (idx % 3) + 1,
    oreb: idx % 2,
    dreb: 3 + (idx % 3),
    reb: 4 + (idx % 4),
    ast: 2 + (idx % 4),
    tov: idx % 3,
    stl: idx % 2,
    blk: idx % 2,
    pf: 2 + (idx % 3),
    fouls_committed: 1 + (idx % 2),
    fouls_drawn: idx % 3,
    plusMinus: (idx % 2 === 0 ? -2 : 3),
    pts: 10 + idx
  }));
}

function makeGame(idx) {
  const opponent = opponents[idx];
  const date = `2025-0${idx + 9}-1${idx}`;
  const bekapakaPlayers = roster.map(makePlayerStats);
  const opponentPlayers = makeOpponentPlayers(opponent);
  return {
    id: `seed-${date}-${opponent.toLowerCase().replace(/\s+/g, '-')}`,
    league: 'atom WEBSKA BASKET LIGA - II D - RZ',
    opponent,
    date,
    time: '19:30',
    venue: 'Koszalin',
    homeAway: 'home',
    finalScore: `${70 + idx * 2} - ${60 + idx}`,
    quarters: [
      { label: 'Q1', home: 18 + idx, away: 14 + idx },
      { label: 'Q2', home: 16 + idx, away: 15 + idx },
      { label: 'Q3', home: 15 + idx, away: 13 + idx },
      { label: 'Q4', home: 21 + idx, away: 18 + idx }
    ],
    fiveMinute: [
      { label: '0-5', home: 6, away: 4, lead: 2 },
      { label: '5-10', home: 8, away: 7, lead: 3 },
      { label: '10-15', home: 7, away: 6, lead: 4 },
      { label: '15-20', home: 8, away: 9, lead: 3 },
      { label: '20-25', home: 5, away: 6, lead: 2 },
      { label: '25-30', home: 7, away: 6, lead: 3 },
      { label: '30-35', home: 8, away: 7, lead: 4 },
      { label: '35-40', home: 9, away: 8, lead: 5 }
    ],
    teamStats: {
      pointsOffTov: { home: 10 + idx, away: 8 + idx },
      pointsInPaint: { home: 24 + idx, away: 20 + idx },
      secondChance: { home: 12 + idx, away: 10 + idx },
      fastBreak: { home: 8 + idx, away: 6 + idx },
      benchPoints: { home: 18 + idx, away: 14 + idx }
    },
    runs: {
      maxLead: `| Najwyższe prowadzenie | ${12 + idx} | ${6 + idx} |`,
      maxRun: `| Najwyższa seria punktowa | 9-0 | 7-0 |`,
      leadChanges: `| Zmiany prowadzenia | ${3 + idx} | |`,
      ties: `| Remisy | ${2 + idx} | |`,
      timeLeading: `| Czas prowadzenia | 24:10 | 15:50 |`
    },
    teams: [
      {
        id: 'BB',
        name: 'BEKAPAKA BOBOLICE',
        code: 'BB',
        isBekapaka: true,
        isHome: true,
        fourFactors: { efg: 0.46, tovPct: 0.17, orbPct: 0.29, ftRate: 0.26 },
        players: bekapakaPlayers
      },
      {
        id: opponent.slice(0, 2).toUpperCase(),
        name: opponent.toUpperCase(),
        code: opponent.slice(0, 2).toUpperCase(),
        isBekapaka: false,
        isHome: false,
        fourFactors: { efg: 0.44, tovPct: 0.19, orbPct: 0.27, ftRate: 0.23 },
        players: opponentPlayers
      }
    ],
    tags: ['seed'],
    coachNotes: 'Przykładowe notatki trenera.'
  };
}

export async function seed() {
  await prisma.rosterPlayer.deleteMany();
  await prisma.game.deleteMany();

  for (const [idx, player] of roster.entries()) {
    const enriched = withRosterStats(player, idx);
    await prisma.rosterPlayer.create({
      data: {
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        number: player.number,
        position: player.position,
        birthDate: player.birthDate ?? null,
        heightCm: player.heightCm ?? null,
        starter: player.starter ?? false,
        data: enriched
      }
    });
  }

  for (let i = 0; i < 5; i += 1) {
    const game = makeGame(i);
    await prisma.game.create({
      data: {
        id: game.id,
        date: game.date,
        opponent: game.opponent,
        data: game
      }
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
