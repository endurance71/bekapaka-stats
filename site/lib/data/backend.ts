import { normalizePlayerIdentity, resolvePlayerJerseyNumber } from './player-identity'
import { resolveLocalPlayerPortrait } from './local-player-portraits'
import { getMediaRecords, approvedMedia, isLocalMediaPreview } from './media-review'
import { backendPath, fetchJson, fetchJsonState } from './client'
import { allowFakeData, resolveFallbackState } from './fallback'
import { mapApiGameToSummary, mapApiGameToSummarySafe } from './map-game'
import {
  rosterPlayerSchema,
  teamStandingSchema,
  type DataState,
  type GameSummary,
  type RosterPlayer,
  type TeamStanding
} from './schemas'
import { parseCollectionItems, optionalNumber, sanitizeNumber, sanitizeText, hasPlayerPhoto, resolvePlayerPhoto } from './utils'

export async function getLeagueTable(): Promise<TeamStanding[]> {
  const state = await getLeagueTableState()
  return state.data
}

function stateFromArray<T>(items: T[], errorMessage?: string): DataState<T[]> {
  if (errorMessage) return { status: 'error', data: [], source: 'live', message: errorMessage }
  if (items.length === 0) return { status: 'empty', data: [], source: 'live' }
  return { status: 'ok', data: items, source: 'live' }
}

// ==========================================
// FALLBACK DATA (BACKEND) — only when SITE_ALLOW_FAKE_DATA=1
// ==========================================

const fallbackRoster: RosterPlayer[] = [
  {
    id: 'p-1',
    firstName: 'Damian',
    lastName: 'Motyliński',
    position: 'PG',
    number: '10',
    ppg: 14.5,
    rpg: 4.2,
    apg: 8.1,
    eval: 18.2,
    fgPercentage: 45.5,
    threePercentage: 38.2,
    ftPercentage: 82.0,
    gamesPlayed: 11,
    heightCm: 188,
    aiDevelopmentSummary: 'Damian jest mózgiem zespołu na pozycji rozgrywającego. Wykazuje się elitarną wizją gry (średnio 8.1 asyst na mecz) oraz znakomitą skutecznością rzutową zza łuku (38.2%). Jego mocną stroną jest podejmowanie decyzji w sytuacjach stresowych, aczkolwiek analiza wideo sugeruje potrzebę zmniejszenia liczby strat przy agresywnym pressingu rywala.'
  },
  {
    id: 'p-2',
    firstName: 'Emil',
    lastName: 'Kłos',
    position: 'PF',
    number: '15',
    ppg: 12.0,
    rpg: 8.5,
    apg: 2.1,
    eval: 15.0,
    fgPercentage: 48.0,
    threePercentage: 30.5,
    ftPercentage: 70.2,
    gamesPlayed: 11,
    heightCm: 198,
    aiDevelopmentSummary: 'Emil to wszechstronny silny skrzydłowy. Jego twarda walka na tablicach owocuje średnio 8.5 zbiórkami. Wykazuje się także dobrym wyczuciem gry tyłem do kosza. W obronie potrafi skutecznie blokować rzuty rywali, a w ataku rozciąga grę grożąc rzutem z dystansu.'
  },
  {
    id: 'p-3',
    firstName: 'Filip',
    lastName: 'Karpiński',
    position: 'SG',
    number: '7',
    ppg: 11.2,
    rpg: 3.1,
    apg: 2.5,
    eval: 10.4,
    fgPercentage: 42.1,
    threePercentage: 36.8,
    ftPercentage: 78.5,
    gamesPlayed: 11,
    heightCm: 190,
    aiDevelopmentSummary: 'Filip to klasyczny strzelec obwodowy. Jego szybki spust i ruch bez piłki sprawiają, że obrona przeciwnika musi stale na niego uważać. Doskonale odnajduje się w szybkich kontratakach i rzutach po chwycie (catch and shoot).'
  },
  {
    id: 'p-4',
    firstName: 'Filip',
    lastName: 'Kawecki',
    position: 'C',
    number: '22',
    ppg: 9.8,
    rpg: 9.1,
    apg: 1.2,
    eval: 14.2,
    fgPercentage: 54.2,
    threePercentage: 0.0,
    ftPercentage: 58.0,
    gamesPlayed: 11,
    heightCm: 202,
    aiDevelopmentSummary: 'Filip dominuje pod tablicami dzięki swojemu wzrostowi (202 cm). Posiada świetne wyczucie pozycji do zbiórek (9.1 na mecz). Jego gra w obronie stwarza tzw. mur w strefie podkoszowej. Pracuje nad poprawą skuteczności rzutów wolnych.'
  },
  {
    id: 'p-5',
    firstName: 'Mirosław',
    lastName: 'Malina',
    position: 'SF',
    number: '4',
    ppg: 8.5,
    rpg: 5.0,
    apg: 3.0,
    eval: 9.8,
    fgPercentage: 43.8,
    threePercentage: 32.0,
    ftPercentage: 72.0,
    gamesPlayed: 11,
    heightCm: 193,
    aiDevelopmentSummary: 'Mirosław to gracz typu utility, wnoszący ogromną energię na parkiet. Wykonuje tzw. brudną robotę w obronie, kryjąc najlepszych strzelców rywali. Znakomicie biega do kontry i potrafi celnie rzucić z półdystansu.'
  },
  {
    id: 'p-6',
    firstName: 'Pablo',
    lastName: 'Iriarte',
    position: 'SG',
    number: '11',
    ppg: 15.2,
    rpg: 3.5,
    apg: 4.0,
    eval: 16.5,
    fgPercentage: 47.2,
    threePercentage: 39.5,
    ftPercentage: 85.0,
    gamesPlayed: 9,
    heightCm: 191,
    aiDevelopmentSummary: 'Pablo to lider punktowy zespołu o znakomitym wyszkoleniu technicznym. Posiada bardzo wysoki procent rzutów zza łuku (39.5%) oraz z rzutów osobistych (85%). Potrafi samodzielnie wykreować sobie pozycję rzutową.'
  },
  {
    id: 'p-7',
    firstName: 'Patryk',
    lastName: 'Szczęśniak',
    position: 'PF',
    number: '8',
    ppg: 10.5,
    rpg: 7.2,
    apg: 1.8,
    eval: 12.0,
    fgPercentage: 46.0,
    threePercentage: 31.0,
    ftPercentage: 68.0,
    gamesPlayed: 10,
    heightCm: 196,
    aiDevelopmentSummary: 'Patryk to solidny skrzydłowy o mocnej budowie fizycznej. Świetnie walczy o pozycję pod koszem, zbiera piłki w ataku i zdobywa punkty z ponowień. Jest cennym elementem rotacji podkoszowej.'
  },
  {
    id: 'p-8',
    firstName: 'Paweł',
    lastName: 'Samusionek',
    position: 'PG',
    number: '3',
    ppg: 7.8,
    rpg: 2.5,
    apg: 5.6,
    eval: 9.5,
    fgPercentage: 40.5,
    threePercentage: 34.0,
    ftPercentage: 80.0,
    gamesPlayed: 11,
    heightCm: 185,
    aiDevelopmentSummary: 'Paweł wnosi spokój i opanowanie na pozycję rozgrywającego. Bardzo dobrze kontroluje tempo gry, rzadko popełnia straty i świetnie obsługuje podaniami wbiegających pod kosz partnerów.'
  },
  {
    id: 'p-9',
    firstName: 'Przemysław',
    lastName: 'Klimek',
    position: 'SF',
    number: '13',
    ppg: 6.4,
    rpg: 4.0,
    apg: 1.5,
    eval: 6.2,
    fgPercentage: 39.0,
    threePercentage: 29.5,
    ftPercentage: 65.0,
    gamesPlayed: 11,
    heightCm: 192,
    aiDevelopmentSummary: 'Przemysław charakteryzuje się nieustępliwością w walce o bezpańskie piłki. Posiada dobry instynkt defensywny i potrafi przecinać podania rywali. Pracuje nad stabilizacją formy rzutowej.'
  },
  {
    id: 'p-10',
    firstName: 'Robert',
    lastName: 'Kulik',
    position: 'PG',
    number: '9',
    ppg: 5.2,
    rpg: 1.8,
    apg: 3.4,
    eval: 5.5,
    fgPercentage: 38.0,
    threePercentage: 31.0,
    ftPercentage: 75.0,
    gamesPlayed: 8,
    heightCm: 182,
    aiDevelopmentSummary: 'Robert to waleczny rozgrywający, który wnosi dużo dynamiki z ławki rezerwowych. Potrafi agresywnie naciskać rywala z piłką na całym boisku i napędzać szybki atak.'
  },
  {
    id: 'p-11',
    firstName: 'Tomasz',
    lastName: 'Kaszubowski',
    position: 'C',
    number: '14',
    ppg: 13.8,
    rpg: 11.2,
    apg: 1.5,
    eval: 21.0,
    fgPercentage: 58.5,
    threePercentage: 0.0,
    ftPercentage: 62.0,
    gamesPlayed: 11,
    heightCm: 200,
    aiDevelopmentSummary: 'Tomasz to absolutny filar podkoszowy i król double-double zespołu (średnio 13.8 pkt i 11.2 zbiórek na mecz). Jego dominacja w polu trzech sekund wymusza na rywalach podwajanie obrony, co otwiera pozycje strzelcom obwodowym. Analiza AI uznaje go za kluczowego gracza obrony strefowej.'
  }
]

const fallbackStandings: TeamStanding[] = [
  { name: 'BrdCrew', position: 1, matches: 1, wins: 1, losses: 0, pointsFor: 64, pointsAgainst: 46, pointsDiff: 18, points: 2, form: ['W'], streak: 'W1' },
  { name: 'Atomówki', position: 2, matches: 1, wins: 1, losses: 0, pointsFor: 70, pointsAgainst: 65, pointsDiff: 5, points: 2, form: ['W'], streak: 'W1' },
  { name: 'Fasolki', position: 3, matches: 1, wins: 0, losses: 1, pointsFor: 65, pointsAgainst: 70, pointsDiff: -5, points: 1, form: ['L'], streak: 'L1', logoUrl: 'https://www.kalk-koszalin.com/storage/legacy/teams/135.jpg' },
  { name: 'Pantery', position: 4, matches: 1, wins: 0, losses: 1, pointsFor: 46, pointsAgainst: 64, pointsDiff: -18, points: 1, form: ['L'], streak: 'L1', logoUrl: 'https://www.kalk-koszalin.com/storage/legacy/teams/110.jpg' },
  { name: 'Grubik Team', position: 5, matches: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointsDiff: 0, points: 0, form: [], streak: null },
  { name: 'Młode Wilki', position: 6, matches: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointsDiff: 0, points: 0, form: [], streak: null, logoUrl: 'https://www.kalk-koszalin.com/storage/legacy/teams/217.jpg' },
  { name: 'BeKaPaKa Bobolice', position: 7, matches: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointsDiff: 0, points: 0, form: [], streak: null },
  { name: 'Maxbau Okna Dako PSP', position: 8, matches: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointsDiff: 0, points: 0, form: [], streak: null },
  { name: 'GMVT TEAM', position: 9, matches: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointsDiff: 0, points: 0, form: [], streak: null, logoUrl: 'https://www.kalk-koszalin.com/storage/media/2026/09/ad002cc1-1bd9-45c8-9784-a17f99cddd23.jpg' },
  { name: 'Kosz-All-In', position: 10, matches: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointsDiff: 0, points: 0, form: [], streak: null }
]

const fallbackGames: GameSummary[] = [
  {
    id: 'g-1',
    date: '2026-05-24',
    opponent: 'Atom Koszalin',
    result: 'W',
    scoreUs: 84,
    scoreThem: 72,
    homeAway: 'home',
    coachNotes: 'Bardzo dobra gra w obronie w drugiej połowie. Kaszubowski zdominował tablice (14 zbiórek). Dobra skuteczność rzutów za 3 punkty (Motyliński 4/6).',
    aiSummary: 'Mecz pod dyktando zespołu BeKaPaKa Bobolice w drugiej połowie. Kluczem do sukcesu była dominacja pod koszem oraz szczelna obrona na obwodzie, która ograniczyła strzelców Atomu Koszalin.'
  },
  {
    id: 'g-2',
    date: '2026-05-17',
    opponent: 'Basket Koszalin',
    result: 'W',
    scoreUs: 76,
    scoreThem: 69,
    homeAway: 'away',
    coachNotes: 'Trudny mecz wyjazdowy. Dużo walki fizycznej. Przypilnowaliśmy końcówkę dzięki rzutom wolnym Iriarte (6/6 w ostatniej minucie).',
    aiSummary: 'BeKaPaKa odnosi cenne zwycięstwo wyjazdowe w zaciętym fizycznym pojedynku. Znakomite wykonanie rzutów wolnych w końcówce oraz opanowanie liderów zapewniło drużynie cenne punkty.'
  },
  {
    id: 'g-3',
    date: '2026-05-10',
    opponent: 'Piwiarnia Bumerang',
    result: 'L',
    scoreUs: 68,
    scoreThem: 85,
    homeAway: 'away',
    coachNotes: 'Lider ligi okazał się za silny. Zbyt dużo strat w pierwszej kwarcie (aż 8), co pozwoliło rywalowi uciec na 15 punktów. Musimy lepiej kontrolować piłkę.',
    aiSummary: 'Niewymuszone straty w początkowej fazie meczu postawiły zespół BeKaPaKa w trudnej sytuacji. Pomimo zrywu w trzeciej kwarcie, Piwiarnia Bumerang kontrolowała przebieg gry do samego końca.'
  },
  {
    id: 'g-4',
    date: '2026-05-03',
    opponent: 'Pantery',
    result: 'L',
    scoreUs: 74,
    scoreThem: 78,
    homeAway: 'home',
    coachNotes: 'Zdecydowała jedna akcja w końcówce. Rywal trafił trójkę z rogu na 10 sekund przed końcem. Dobra walka, ale zabrakło trochę szczęścia i lepszej komunikacji w obronie.',
    aiSummary: 'Dramatyczna końcówka w Bobolicach. Zespół Panter przechylił szalę zwycięstwa celnym rzutem z dystansu w ostatnich sekundach meczu. Mimo porażki, BeKaPaKa pokazała charakter w walce z faworytem.'
  },
  {
    id: 'g-5',
    date: '2026-04-26',
    opponent: 'Młode Wilki',
    result: 'L',
    scoreUs: 79,
    scoreThem: 82,
    homeAway: 'away',
    coachNotes: 'Mecz walki do ostatniej sekundy. Mieliśmy rzut na dogrywkę, ale piłka wykręciła się z kosza. Wyróżnienie dla Kłosa za walkę podkoszową (16 pkt, 10 zb).',
    aiSummary: 'Kolejny niezwykle wyrównany pojedynek, który rozstrzygnął się w ostatnim posiadaniu piłki. Młode Wilki utrzymały minimalną przewagę, chociaż BeKaPaKa walczyła do samego końca o doprowadzenie do dogrywki.'
  },
  {
    id: 'g-6',
    date: '2026-04-19',
    opponent: 'Grubik Team',
    result: 'W',
    scoreUs: 88,
    scoreThem: 80,
    homeAway: 'home',
    coachNotes: 'Świetny mecz strzelecki całego zespołu. Iriarte zdobył 25 punktów, a Motyliński rozdał 10 asyst. W obronie kontrolowaliśmy tablicę.',
    aiSummary: 'Ofensywny pokaz gry BeKaPaKa Bobolice przed własną publicznością. Znakomite dzielenie się piłką oraz wysoka skuteczność liderów zespołu zaowocowały zdobyciem 88 punktów i pewnym zwycięstwem.'
  }
]

// ==========================================
// DATA FETCHING FUNCTIONS
// ==========================================

export async function getLeagueTableState(): Promise<DataState<TeamStanding[]>> {
  try {
    const response = await fetchJsonState<Array<Record<string, unknown>> | { data: Array<Record<string, unknown>>; meta?: DataState<TeamStanding[]>['meta'] }>(backendPath('/api/league/table?includeMeta=1'), {
      // Synchronizacja KALK zapisuje tabelę niezależnie od procesu Next.js.
      // Krótki TTL zapobiega utrzymaniu pustej tabeli po imporcie sezonu.
      revalidate: 60,
      tags: ['backend', 'backend-table']
    })
    if (response.status === 'error') {
      return resolveFallbackState('error', fallbackStandings, [], response.message)
    }

    const payload = Array.isArray(response.payload) ? response.payload : response.payload.data
    const meta = Array.isArray(response.payload) ? undefined : response.payload.meta
    const rows = payload
      .map((row) => {
        const wins = sanitizeNumber(row.wins, 0)
        const losses = sanitizeNumber(row.losses, 0)
        const matches = sanitizeNumber(row.matches, wins + losses)
        const pointsFor = sanitizeNumber(row.pointsFor, NaN)
        const pointsAgainst = sanitizeNumber(row.pointsAgainst, NaN)
        const pointsDiff = Number.isFinite(pointsFor) && Number.isFinite(pointsAgainst)
          ? pointsFor - pointsAgainst
          : sanitizeNumber(row.pointsDiff, 0)

        let form: string[] = []
        if (Array.isArray(row.form)) {
          form = row.form.map((f) => String(f).trim()).filter(Boolean)
        } else if (typeof row.form === 'string' && row.form) {
          form = row.form.split(',').map((f) => f.trim()).filter(Boolean)
        }

        const streak = typeof row.streak === 'string' && row.streak.trim() && row.streak.trim() !== '—'
          ? row.streak.trim()
          : null

        const logoUrl = typeof row.logoUrl === 'string' && row.logoUrl.trim()
          ? row.logoUrl.trim()
          : null

        return {
          name: sanitizeText(row.team, sanitizeText(row.name, 'Druzyna')),
          position: sanitizeNumber(row.position, sanitizeNumber(row.rank, 0)),
          matches,
          points: sanitizeNumber(row.points, 0),
          wins,
          losses,
          pointsFor,
          pointsAgainst,
          pointsDiff,
          logoUrl,
          form,
          streak
        }
      })
      .sort((a, b) => {
        if (a.position > 0 && b.position > 0) return a.position - b.position
        return b.points - a.points
      })

    const mapped = rows.map((row, index) => {
      const standing: Record<string, unknown> = {
        name: row.name,
        position: row.position > 0 ? row.position : index + 1,
        matches: row.matches,
        wins: row.wins,
        losses: row.losses,
        points: row.points,
        pointsDiff: row.pointsDiff,
        logoUrl: row.logoUrl,
        form: row.form,
        streak: row.streak
      }
      if (Number.isFinite(row.pointsFor)) standing.pointsFor = row.pointsFor
      if (Number.isFinite(row.pointsAgainst)) standing.pointsAgainst = row.pointsAgainst
      return standing
    })
    const items = parseCollectionItems(mapped, teamStandingSchema, 'team-standing')

    if (items.length === 0) {
      return resolveFallbackState('empty', fallbackStandings, [], 'Brak danych tabeli z API.')
    }

    return { ...stateFromArray(items), meta }
  } catch {
    return resolveFallbackState('error', fallbackStandings, [], 'Nie udało się pobrać tabeli z backendu.')
  }
}

export async function getRecentGamesState(limit = 100): Promise<DataState<GameSummary[]>> {
  try {
    const response = await fetchJsonState<Array<Record<string, unknown>>>(backendPath('/api/games'), {
      revalidate: 60,
      tags: ['backend', 'backend-games']
    })
    if (response.status === 'error') {
      return resolveFallbackState('error', fallbackGames.slice(0, limit), [], response.message)
    }

    const items = response.payload
      .slice(0, limit)
      .map((game, index) => mapApiGameToSummary(game, index))

    if (items.length === 0) {
      return resolveFallbackState('empty', fallbackGames.slice(0, limit), [], 'Brak meczów w API.')
    }

    return stateFromArray(items)
  } catch {
    return resolveFallbackState('error', fallbackGames.slice(0, limit), [], 'Nie udało się pobrać meczów z backendu.')
  }
}

function findFallbackGameById(id: string): GameSummary | null {
  return fallbackGames.find((g) => g.id === id) ?? null
}

export async function getGameByIdState(id: string, fresh = false): Promise<DataState<GameSummary | null>> {
  const fallbackMatch = findFallbackGameById(id)
  const allowFake = allowFakeData() && Boolean(fallbackMatch)

  try {
    const game = await fetchJson<Record<string, unknown>>(backendPath(`/api/games/${encodeURIComponent(id)}`), {
      revalidate: fresh ? 0 : 60,
      tags: ['backend', 'backend-games']
    })
    if (!game) {
      if (allowFake && fallbackMatch) {
        return {
          status: 'ok',
          data: fallbackMatch,
          source: 'fallback',
          message: 'Backend niedostępny — wyświetlamy dane podstawowe meczu.'
        }
      }
      return { status: 'error', data: null, source: 'live', message: 'Mecz nie znaleziony.' }
    }

    const mapped = mapApiGameToSummarySafe(game)
    if (!mapped) {
      if (allowFake && fallbackMatch) {
        return {
          status: 'ok',
          data: fallbackMatch,
          source: 'fallback',
          message: 'Nie udało się przetworzyć odpowiedzi API — dane podstawowe.'
        }
      }
      return { status: 'error', data: null, source: 'live', message: 'Nieprawidłowe dane meczu z API.' }
    }

    return { status: 'ok', data: mapped, source: 'live' }
  } catch {
    if (allowFake && fallbackMatch) {
      return {
        status: 'ok',
        data: fallbackMatch,
        source: 'fallback',
        message: 'Nie udało się pobrać szczegółów meczu z backendu.'
      }
    }
    return {
      status: 'error',
      data: null,
      source: 'live',
      message: 'Nie udało się pobrać szczegółów meczu z backendu.'
    }
  }
}

export async function getRoster(): Promise<RosterPlayer[]> {
  const state = await getRosterState()
  return state.data
}

export async function getRosterState(): Promise<DataState<RosterPlayer[]>> {
  try {
    const response = await fetchJsonState<Array<Record<string, unknown>>>(backendPath('/api/roster'), {
      revalidate: 900,
      tags: ['backend', 'backend-roster']
    })
    if (response.status === 'error') {
      return resolveFallbackState('error', fallbackRoster, [], response.message)
    }

    const mapped = response.payload.map((player, index) => {
      const normalized = normalizePlayerIdentity({
        kalkPlayer: player.kalkPlayer,
        id: sanitizeText(player.id, String(index)),
        firstName: sanitizeText(player.firstName, ''),
        lastName: sanitizeText(player.lastName, ''),
        position: sanitizeText(player.position, 'Brak'),
        number: sanitizeText(player.number, '-'),
        photo: player.photo ? String(player.photo) : null,
        photoUrl: player.photo_url || player.photoUrl ? String(player.photo_url || player.photoUrl) : null,
        ppg: optionalNumber(player.ppg),
        rpg: optionalNumber(player.rpg),
        apg: optionalNumber(player.apg),
        eval: optionalNumber(player.eval) ?? null,
        fgPercentage: optionalNumber(player.fgPercentage),
        threePercentage: optionalNumber(player.threePercentage),
        ftPercentage: optionalNumber(player.ftPercentage),
        tsPercentage: optionalNumber(player.tsPercentage) ?? null,
        eFgPercentage: optionalNumber(player.eFgPercentage) ?? null,
        plusMinus: optionalNumber(player.plusMinus) ?? null,
        seasonId: typeof player.seasonId === 'string' ? player.seasonId : undefined,
        seasonLabel: typeof player.seasonLabel === 'string' ? player.seasonLabel : undefined,
        numberSource: sanitizeText(player.number).trim() && sanitizeText(player.number).trim() !== '-' ? 'source' as const : 'unknown' as const,
        ...Object.fromEntries(['fgm', 'fga', 'threePm', 'threePa', 'ftm', 'fta'].map(key => [key, optionalNumber(player[key])])),
        gamesPlayed: optionalNumber(player.gamesPlayed),
        birthDate: player.birthDate ? String(player.birthDate) : null,
        heightCm: optionalNumber(player.heightCm) ?? null,
        aiDevelopmentSummary: player.aiDevelopmentSummary ? String(player.aiDevelopmentSummary) : null,
        games: Array.isArray(player.games) ? player.games : undefined
      })
      const resolvedNumber = resolvePlayerJerseyNumber(normalized)
      return {
        ...normalized,
        number: resolvedNumber ?? normalized.number,
        numberSource: normalized.numberSource === 'source' ? 'source' as const : resolvedNumber ? 'brand-fallback' as const : 'unknown' as const
      }
    })
    const records = await getMediaRecords()
    const localPreview = isLocalMediaPreview()
    const items = parseCollectionItems(mapped, rosterPlayerSchema, 'roster-player').map(player => {
      const review = approvedMedia(records, hasPlayerPhoto(player) ? resolvePlayerPhoto(player) : undefined)
      // Local portrait mockup; retain the original photograph outside the local preview.
      const photo = resolveLocalPlayerPortrait(player, localPreview) ?? player.photo
      return {
        ...player,
        photo,
        photoApproved: !!review || (localPreview && hasPlayerPhoto(player)),
        photoAlt: review?.alt
      }
    })

    if (items.length === 0) {
      return resolveFallbackState('empty', fallbackRoster, [], 'Brak składu w API.')
    }

    return stateFromArray(items)
  } catch {
    return resolveFallbackState('error', fallbackRoster, [], 'Nie udało się pobrać składu z backendu.')
  }
}
