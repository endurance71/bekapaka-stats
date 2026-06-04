import { backendPath, fetchJson, fetchJsonState } from './client'
import { mapApiGameToSummary, mapApiGameToSummarySafe } from './map-game'
import {
  rosterPlayerSchema,
  teamStandingSchema,
  type DataState,
  type GameSummary,
  type RosterPlayer,
  type TeamStanding
} from './schemas'
import { sanitizeNumber, sanitizeText } from './utils'

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
// FALLBACK DATA (BACKEND)
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
  { name: 'PIWIARNIA BUMERANG', position: 1, wins: 11, losses: 0 },
  { name: 'PANTERY', position: 2, wins: 10, losses: 1 },
  { name: 'MŁODE WILKI', position: 3, wins: 9, losses: 2 },
  { name: 'POLITECHNIKA KOSZALIŃSKA', position: 4, wins: 6, losses: 5 },
  { name: 'GRUBIK TEAM', position: 5, wins: 6, losses: 5 },
  { name: 'BEKAPAKA BOBOLICE', position: 6, wins: 5, losses: 6 },
  { name: 'BASKET KOSZALIN', position: 7, wins: 4, losses: 7 },
  { name: 'ATOM KOSZALIN', position: 8, wins: 3, losses: 8 },
  { name: 'YOUNG BOYS', position: 9, wins: 1, losses: 10 },
  { name: 'OLD STARS', position: 10, wins: 0, losses: 11 }
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
    const response = await fetchJsonState<Array<Record<string, unknown>>>(backendPath('/api/league/table'), { revalidate: 900 })
    if (response.status === 'error') {
      return { status: 'error', data: fallbackStandings, source: 'fallback', message: response.message }
    }

    const rows = response.payload
      .map((row) => ({
        name: sanitizeText(row.team, sanitizeText(row.name, 'Druzyna')),
        position: sanitizeNumber(row.position, sanitizeNumber(row.rank, 0)),
        points: sanitizeNumber(row.points, 0),
        wins: sanitizeNumber(row.wins, 0),
        losses: sanitizeNumber(row.losses, 0),
        pointsFor: sanitizeNumber(row.pointsFor, NaN),
        pointsAgainst: sanitizeNumber(row.pointsAgainst, NaN)
      }))
      .sort((a, b) => b.points - a.points)

    const items = rows
      .map((row, index) => {
        const standing: Record<string, unknown> = {
          name: row.name,
          position: row.position > 0 ? row.position : index + 1,
          wins: row.wins,
          losses: row.losses
        }
        if (row.points > 0) standing.points = row.points
        if (Number.isFinite(row.pointsFor)) standing.pointsFor = row.pointsFor
        if (Number.isFinite(row.pointsAgainst)) standing.pointsAgainst = row.pointsAgainst
        return standing
      })
      .map((item) => teamStandingSchema.parse(item))

    if (items.length === 0) {
      return { status: 'empty', data: fallbackStandings, source: 'fallback', message: 'Brak danych tabeli z API.' }
    }

    return stateFromArray(items)
  } catch {
    return { status: 'error', data: fallbackStandings, source: 'fallback', message: 'Nie udało się pobrać tabeli z backendu.' }
  }
}

export async function getRecentGamesState(limit = 100): Promise<DataState<GameSummary[]>> {
  try {
    const response = await fetchJsonState<Array<Record<string, unknown>>>(backendPath('/api/games'), { revalidate: 300 })
    if (response.status === 'error') {
      return { status: 'error', data: fallbackGames.slice(0, limit), source: 'fallback', message: response.message }
    }

    const items = response.payload
      .slice(0, limit)
      .map((game, index) => mapApiGameToSummary(game, index))

    if (items.length === 0) {
      return { status: 'empty', data: fallbackGames.slice(0, limit), source: 'fallback', message: 'Brak meczów w API.' }
    }

    return stateFromArray(items)
  } catch {
    return { status: 'error', data: fallbackGames.slice(0, limit), source: 'fallback', message: 'Nie udało się pobrać meczów z backendu.' }
  }
}

function findFallbackGameById(id: string): GameSummary | null {
  return fallbackGames.find((g) => g.id === id) ?? null
}

export async function getGameByIdState(id: string): Promise<DataState<GameSummary | null>> {
  const fallbackMatch = findFallbackGameById(id)

  try {
    const game = await fetchJson<Record<string, unknown>>(backendPath(`/api/games/${encodeURIComponent(id)}`), {
      revalidate: 120
    })
    if (!game) {
      if (fallbackMatch) {
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
      if (fallbackMatch) {
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
    if (fallbackMatch) {
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
    const response = await fetchJsonState<Array<Record<string, unknown>>>(backendPath('/api/roster'), { revalidate: 900 })
    if (response.status === 'error') {
      return { status: 'error', data: fallbackRoster, source: 'fallback', message: response.message }
    }

    const items = response.payload
      .map((player, index) => ({
        id: sanitizeText(player.id, String(index)),
        firstName: sanitizeText(player.firstName, ''),
        lastName: sanitizeText(player.lastName, ''),
        position: sanitizeText(player.position, 'Brak'),
        number: sanitizeText(player.number, '-'),
        photo: player.photo ? String(player.photo) : null,
        photoUrl: player.photo_url || player.photoUrl ? String(player.photo_url || player.photoUrl) : null,
        ppg: player.ppg !== undefined ? sanitizeNumber(player.ppg, 0) : undefined,
        rpg: player.rpg !== undefined ? sanitizeNumber(player.rpg, 0) : undefined,
        apg: player.apg !== undefined ? sanitizeNumber(player.apg, 0) : undefined,
        eval: player.eval !== undefined && player.eval !== null ? sanitizeNumber(player.eval, 0) : null,
        fgPercentage: player.fgPercentage !== undefined ? sanitizeNumber(player.fgPercentage, 0) : undefined,
        threePercentage: player.threePercentage !== undefined ? sanitizeNumber(player.threePercentage, 0) : undefined,
        ftPercentage: player.ftPercentage !== undefined ? sanitizeNumber(player.ftPercentage, 0) : undefined,
        tsPercentage: player.tsPercentage !== undefined ? sanitizeNumber(player.tsPercentage, 0) : undefined,
        eFgPercentage: player.eFgPercentage !== undefined ? sanitizeNumber(player.eFgPercentage, 0) : undefined,
        plusMinus: player.plusMinus !== undefined ? sanitizeNumber(player.plusMinus, 0) : undefined,
        gamesPlayed: player.gamesPlayed !== undefined ? sanitizeNumber(player.gamesPlayed, 0) : undefined,
        birthDate: player.birthDate ? String(player.birthDate) : null,
        heightCm: player.heightCm !== undefined && player.heightCm !== null ? sanitizeNumber(player.heightCm, 0) : null,
        aiDevelopmentSummary: player.aiDevelopmentSummary ? String(player.aiDevelopmentSummary) : null,
        games: Array.isArray(player.games) ? player.games : undefined
      }))
      .map((item) => rosterPlayerSchema.parse(item))

    if (items.length === 0) {
      return { status: 'empty', data: fallbackRoster, source: 'fallback', message: 'Brak składu w API.' }
    }

    return stateFromArray(items)
  } catch {
    return { status: 'error', data: fallbackRoster, source: 'fallback', message: 'Nie udało się pobrać składu z backendu.' }
  }
}
