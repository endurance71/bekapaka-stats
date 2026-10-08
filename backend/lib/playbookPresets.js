/**
 * Biblioteka gotowych, animowanych zagrywek i systemów obrony (BeKaPaKa Stats).
 * Zawiera atak pozycyjny, auty, zagrywki po czasie oraz obronę (każdy swego z pomocą i powrotem,
 * strefa 2-3 ze strefami odpowiedzialności, strefa 3-2 z murem na obwodzie). `legacyName` = dawna nazwa do aktualizacji wierszy w bazie.
 */

export const DEFAULT_PLAYBOOK_PRESETS = [
  // ==========================================
  // 1. ROGI Z ZASŁONĄ ODCHODZĄCĄ (ATAK)
  // ==========================================
  {
    name: 'Rogi z zasłoną odchodzącą (Horns Flare)',
    legacyName: 'Horns Flare vs Strefa 2-3',
    category: 'half_court',
    targetDefense: 'Strefa 2-3',
    description: 'Klasyczne ustawienie „rogi”: dwóch wysokich zawodników na rogach pola trzech sekund rozciąga pierwszą linię strefy. 5 (środkowy) stawia zasłonę w plecy obrońcy D2, a 3 (niski skrzydłowy) odbiega od niej do rogu boiska i dostaje piłkę na czysty rzut za 3.',
    tags: ['Rogi', 'Strefa 2-3', 'Rzut z rogu', 'Rzut za 3'],
    diagramData: {
      duration: 8.5,
      outcomeText: 'Celny rzut za 3: zawodnik 3 (niski skrzydłowy) • +3 pkt',
      coachingKeys: [
        'Ustawienie w „rogi” zmusza obronę strefową do rozciągnięcia pierwszej linii',
        'Zasłona 5 (środkowy) na górze musi zatrzymać powrót obrońcy D2',
        'Długie podanie przez boisko musi pójść mocno, prosto w ręce 3 (niski skrzydłowy)',
        'Po zasłonie 5 od razu biegnie pod kosz po zbiórkę w ataku'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie wyjściowe w „rogi”',
          description: 'Drużyna ustawia się w „rogi”: 1 (rozgrywający) na szczycie łuku, 2 (rzucający obrońca) i 3 (niski skrzydłowy) na skrzydłach, 4 (silny skrzydłowy) i 5 (środkowy) na rogach pola trzech sekund. Rywal broni strefą 2-3.',
          coachingCues: ['Szerokie ustawienie', 'Spokojnie odczytaj obronę']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Zasłona w plecy D2 i wybieg 3 do rogu',
          description: '5 (środkowy) podchodzi i stawia mocną zasłonę w plecy D2. 3 (niski skrzydłowy) przebiega tuż obok 5, bark w bark, i odbiega do rogu. D2 zostaje zablokowany.',
          coachingCues: ['Bark w bark przy zasłonie', 'Sprint łukiem do rogu']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Długie podanie przez boisko do 3',
          description: '1 (rozgrywający) posyła mocne podanie przez całe boisko do 3 (niski skrzydłowy), który wybiega do rogu. Dolny obrońca D5 nie zdąży doskoczyć.',
          coachingCues: ['Podanie prosto w klatkę piersiową', 'Gotowy do rzutu zaraz po chwycie']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Rzut za 3 i zbiórka 5',
          description: '3 (niski skrzydłowy) oddaje czysty rzut za 3. Piłka wpada do kosza (+3 pkt), a 5 (środkowy) biegnie pod kosz na zbiórkę.',
          coachingCues: ['Rzut od razu po chwycie', '5 pilnuje zbiórki pod koszem']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 1,
          name: '1 (rozgrywający)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 80, heading: 0, action: 'idle' },
            { time: 1.5, x: 50, y: 80, heading: 0, action: 'idle' },
            { time: 3.5, x: 66, y: 72, heading: 60, action: 'dribble' },
            { time: 5.5, x: 66, y: 72, heading: 110, action: 'idle' },
            { time: 8.5, x: 64, y: 76, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 2,
          name: '2 (rzucający obrońca)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 16, y: 62, heading: 0, action: 'idle' },
            { time: 1.5, x: 16, y: 62, heading: 0, action: 'idle' },
            { time: 4.5, x: 20, y: 72, heading: 45, action: 'idle' },
            { time: 8.5, x: 22, y: 76, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 3,
          name: '3 (niski skrzydłowy)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 84, y: 62, heading: 0, action: 'idle' },
            { time: 1.5, x: 84, y: 62, heading: 0, action: 'idle' },
            { time: 3.2, x: 70, y: 60, heading: 240, action: 'cut' },
            { time: 5.5, x: 90, y: 16, heading: 270, action: 'catch' },
            { time: 6.5, x: 90, y: 16, heading: 270, action: 'shoot' },
            { time: 8.5, x: 90, y: 16, heading: 270, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 4,
          name: '4 (silny skrzydłowy)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 36, y: 44, heading: 0, action: 'idle' },
            { time: 1.5, x: 36, y: 44, heading: 0, action: 'idle' },
            { time: 4.5, x: 40, y: 36, heading: 30, action: 'idle' },
            { time: 8.5, x: 44, y: 25, heading: 0, action: 'roll' }
          ]
        },
        {
          id: 'O5',
          number: 5,
          name: '5 (środkowy)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 64, y: 44, heading: 0, action: 'idle' },
            { time: 1.5, x: 64, y: 44, heading: 0, action: 'idle' },
            { time: 3.2, x: 64, y: 66, heading: 90, action: 'set_screen' },
            { time: 5.5, x: 64, y: 66, heading: 90, action: 'set_screen' },
            { time: 7.0, x: 50, y: 18, heading: 0, action: 'roll' },
            { time: 8.5, x: 50, y: 18, heading: 0, action: 'idle' }
          ]
        },
        // Obrońcy strefy 2-3
        {
          id: 'D1',
          number: 1,
          name: 'D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 44, y: 70, heading: 180, action: 'defend' },
            { time: 1.5, x: 44, y: 70, heading: 180, action: 'defend' },
            { time: 4.0, x: 52, y: 66, heading: 140, action: 'defend' },
            { time: 8.5, x: 52, y: 66, heading: 140, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 56, y: 70, heading: 180, action: 'defend' },
            { time: 1.5, x: 56, y: 70, heading: 180, action: 'defend' },
            { time: 3.2, x: 62, y: 66, heading: 180, action: 'defend' },
            { time: 5.5, x: 62, y: 66, heading: 180, action: 'defend' },
            { time: 8.5, x: 62, y: 66, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 22, y: 32, heading: 180, action: 'defend' },
            { time: 1.5, x: 22, y: 32, heading: 180, action: 'defend' },
            { time: 8.5, x: 26, y: 32, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 50, y: 24, heading: 180, action: 'defend' },
            { time: 1.5, x: 50, y: 24, heading: 180, action: 'defend' },
            { time: 5.0, x: 50, y: 20, heading: 180, action: 'defend' },
            { time: 8.5, x: 50, y: 20, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 78, y: 32, heading: 180, action: 'defend' },
            { time: 1.5, x: 78, y: 32, heading: 180, action: 'defend' },
            { time: 4.5, x: 78, y: 32, heading: 90, action: 'defend' },
            { time: 6.5, x: 88, y: 20, heading: 90, action: 'defend' },
            { time: 8.5, x: 88, y: 20, heading: 90, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 50, y: 80, holderId: 'O1' },
          { time: 1.5, x: 50, y: 80, holderId: 'O1' },
          { time: 3.5, x: 66, y: 72, holderId: 'O1' },
          { time: 4.5, x: 66, y: 72, holderId: 'O1' },
          { time: 5.5, x: 90, y: 16, holderId: 'O3', isPass: true, arcHeight: 0.2 },
          { time: 6.5, x: 90, y: 16, holderId: 'O3' },
          { time: 7.5, x: 50, y: 12.5, holderId: null, isShot: true, arcHeight: 1.1 },
          { time: 8.5, x: 50, y: 12.5, holderId: null }
        ]
      }
    }
  },

  // ==========================================
  // 2. ZASŁONA NA PIŁCE Z ZASŁONĄ W PLECY (ATAK)
  // ==========================================
  {
    name: 'Zasłona na piłce z zasłoną w plecy (Spain pick and roll)',
    legacyName: 'Spain Pick & Roll (Zasłona z pleców)',
    category: 'half_court',
    targetDefense: 'Obrona każdy swego (cofnięcie / zmiana krycia)',
    description: 'Zasłona na piłce i zbiegnięcie (pick and roll), do którego 3 (niski skrzydłowy) dokłada zasłonę w plecy obrońcy D5. Dzięki temu 5 (środkowy) ma wolną drogę pod kosz i kończy akcję wsadem.',
    tags: ['Zasłona na piłce', 'Zasłona w plecy', 'Wsad', 'Atak pozycyjny'],
    diagramData: {
      duration: 8.5,
      outcomeText: 'Wsad spod kosza: zawodnik 5 (środkowy) • +2 pkt',
      coachingKeys: [
        'Zasłona w plecy od 3 (niski skrzydłowy) musi zatrzymać D5, który cofa się pod kosz',
        'Po zasłonie 3 od razu wychodzi na szczyt łuku, gotowy do rzutu za 3',
        '5 (środkowy) po minięciu zasłony kończy akcję wsadem'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie wyjściowe – wszyscy na obwodzie',
          description: 'Zawodnicy stoją szeroko wokół linii rzutów za 3. 1 (rozgrywający) na szczycie łuku daje znak do rozpoczęcia zagrywki.',
          coachingCues: ['Jak najszersze ustawienie', 'Trzymaj swoje miejsce']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Zasłona na piłce i zasłona w plecy D5',
          description: '5 (środkowy) stawia zasłonę na piłce. D5 cofa się pod kosz, a 3 (niski skrzydłowy) stawia mu mocną zasłonę w plecy na wysokości linii rzutów wolnych. D5 zostaje odcięty.',
          coachingCues: ['Mocna, nieruchoma zasłona', 'Wolna droga do kosza']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Wysokie podanie nad obrońcami do 5',
          description: '1 (rozgrywający) posyła wysokie podanie górą do 5 (środkowy), który wbiega w wolne miejsce pod koszem. 3 wychodzi na szczyt łuku.',
          coachingCues: ['Miękkie, wysokie podanie', 'Chwyt oburącz w powietrzu']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Wsad 5 (+2 pkt) i powrót do obrony',
          description: '5 (środkowy) łapie piłkę w powietrzu i kończy akcję wsadem (+2 pkt).',
          coachingCues: ['Pewne wykończenie', 'Od razu wracaj do obrony']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 1,
          name: '1 (rozgrywający)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 80, heading: 0, action: 'idle' },
            { time: 1.5, x: 50, y: 80, heading: 0, action: 'idle' },
            { time: 3.5, x: 36, y: 62, heading: 300, action: 'dribble' },
            { time: 5.5, x: 36, y: 62, heading: 45, action: 'idle' },
            { time: 8.5, x: 34, y: 62, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 2,
          name: '2 (rzucający obrońca)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 16, y: 68, heading: 0, action: 'idle' },
            { time: 1.5, x: 16, y: 68, heading: 0, action: 'idle' },
            { time: 8.5, x: 14, y: 68, heading: 45, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 3,
          name: '3 (niski skrzydłowy)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 52, heading: 0, action: 'idle' },
            { time: 1.5, x: 50, y: 52, heading: 0, action: 'idle' },
            { time: 3.5, x: 48, y: 44, heading: 0, action: 'set_screen' },
            { time: 5.5, x: 58, y: 78, heading: 180, action: 'pop' },
            { time: 8.5, x: 58, y: 78, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 4,
          name: '4 (silny skrzydłowy)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 84, y: 30, heading: 0, action: 'idle' },
            { time: 1.5, x: 84, y: 30, heading: 0, action: 'idle' },
            { time: 8.5, x: 88, y: 22, heading: 315, action: 'idle' }
          ]
        },
        {
          id: 'O5',
          number: 5,
          name: '5 (środkowy)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 56, y: 72, heading: 0, action: 'idle' },
            { time: 1.5, x: 56, y: 72, heading: 0, action: 'idle' },
            { time: 3.0, x: 46, y: 74, heading: 270, action: 'set_screen' },
            { time: 5.5, x: 50, y: 18, heading: 0, action: 'roll' },
            { time: 6.5, x: 50, y: 13, heading: 0, action: 'catch' },
            { time: 8.5, x: 50, y: 12.5, heading: 0, action: 'shoot' }
          ]
        },
        // Obrońcy
        {
          id: 'D1',
          number: 1,
          name: 'D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 50, y: 74, heading: 180, action: 'defend' },
            { time: 1.5, x: 50, y: 74, heading: 180, action: 'defend' },
            { time: 3.0, x: 44, y: 72, heading: 180, action: 'defend' },
            { time: 5.5, x: 40, y: 64, heading: 140, action: 'defend' },
            { time: 8.5, x: 38, y: 64, heading: 140, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 20, y: 62, heading: 180, action: 'defend' },
            { time: 8.5, x: 18, y: 62, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 50, y: 42, heading: 180, action: 'defend' },
            { time: 3.5, x: 50, y: 42, heading: 180, action: 'defend' },
            { time: 5.5, x: 54, y: 68, heading: 180, action: 'defend' },
            { time: 8.5, x: 56, y: 70, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 80, y: 26, heading: 180, action: 'defend' },
            { time: 8.5, x: 80, y: 26, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 56, y: 66, heading: 180, action: 'defend' },
            { time: 1.5, x: 56, y: 66, heading: 180, action: 'defend' },
            { time: 3.5, x: 48, y: 44, heading: 180, action: 'defend' },
            { time: 5.5, x: 48, y: 44, heading: 180, action: 'defend' },
            { time: 8.5, x: 48, y: 30, heading: 0, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 50, y: 80, holderId: 'O1' },
          { time: 1.5, x: 50, y: 80, holderId: 'O1' },
          { time: 3.5, x: 36, y: 62, holderId: 'O1' },
          { time: 4.5, x: 36, y: 62, holderId: 'O1' },
          { time: 5.8, x: 50, y: 14, holderId: 'O5', isPass: true, arcHeight: 0.8 },
          { time: 6.5, x: 50, y: 13, holderId: 'O5' },
          { time: 7.2, x: 50, y: 12.5, holderId: null, isShot: true, arcHeight: 0.1 },
          { time: 8.5, x: 50, y: 12.5, holderId: null }
        ]
      }
    }
  },

  // ==========================================
  // 3. AUT SPOD KOSZA – ZASŁONA W KWADRACIE
  // ==========================================
  {
    name: 'Aut spod kosza – zasłona w kwadracie (Box Cross)',
    legacyName: 'Box Cross BLOB (Aut spod kosza)',
    category: 'blob',
    targetDefense: 'Obrona każdy swego',
    description: 'Wprowadzenie piłki z autu spod kosza z ustawienia w kwadrat. 4 (silny skrzydłowy) stawia zasłonę obrońcy D5, a 5 (środkowy) wbiega pod sam kosz na łatwy dwutakt.',
    tags: ['Aut spod kosza', 'Ustawienie w kwadrat', 'Dwutakt', 'Punkty spod kosza'],
    diagramData: {
      duration: 8.5,
      outcomeText: 'Dwutakt spod kosza: zawodnik 5 (środkowy) • +2 pkt',
      coachingKeys: [
        'Ustawienie w kwadrat utrudnia obronie upilnowanie wszystkich zawodników',
        'Zasłona 4 (silny skrzydłowy) wzdłuż linii końcowej musi całkowicie zatrzymać D5',
        'Podający 1 (rozgrywający) czeka, aż 5 (środkowy) minie zasłonę',
        'Zawodnik za linią rzutów za 3 to opcja awaryjna'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie w kwadrat',
          description: 'Czterech zawodników ustawia się w kwadrat w polu trzech sekund. 1 (rozgrywający) wprowadza piłkę zza linii końcowej i daje znak.',
          coachingCues: ['Pełne skupienie', 'Gotowość do zasłon']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Zasłona 4 i wbiegnięcie 5 pod kosz',
          description: '4 (silny skrzydłowy) stawia zasłonę wzdłuż linii końcowej dla 5 (środkowy). D5 wpada na zasłonę i zostaje odcięty, a 5 wbiega pod sam kosz.',
          coachingCues: ['Mocna, nieruchoma zasłona', 'Sprint prosto pod kosz']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Podanie kozłem pod kosz do 5',
          description: '1 (rozgrywający) posyła dokładne podanie kozłem do wolnego 5 (środkowy) pod samym koszem.',
          coachingCues: ['Niskie podanie', 'Pewny chwyt oburącz']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Dwutakt 5 (+2 pkt)',
          description: '5 (środkowy) bez obrońcy kończy akcję łatwym dwutaktem (+2 pkt).',
          coachingCues: ['Wysokie wyjście do kosza', 'Punkty spod kosza']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 1,
          name: '1 (rozgrywający)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 2, heading: 0, action: 'idle' },
            { time: 8.5, x: 50, y: 2, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 2,
          name: '2 (rzucający obrońca)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 36, y: 36, heading: 180, action: 'idle' },
            { time: 1.5, x: 36, y: 36, heading: 180, action: 'idle' },
            { time: 4.5, x: 75, y: 65, heading: 45, action: 'cut' },
            { time: 8.5, x: 75, y: 65, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 3,
          name: '3 (niski skrzydłowy)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 64, y: 36, heading: 180, action: 'idle' },
            { time: 1.5, x: 64, y: 36, heading: 180, action: 'idle' },
            { time: 3.5, x: 50, y: 36, heading: 270, action: 'set_screen' },
            { time: 8.5, x: 50, y: 36, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 4,
          name: '4 (silny skrzydłowy)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 36, y: 18, heading: 180, action: 'idle' },
            { time: 1.5, x: 36, y: 18, heading: 180, action: 'idle' },
            { time: 3.5, x: 50, y: 18, heading: 90, action: 'set_screen' },
            { time: 8.5, x: 50, y: 18, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O5',
          number: 5,
          name: '5 (środkowy)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 64, y: 18, heading: 180, action: 'idle' },
            { time: 1.5, x: 64, y: 18, heading: 180, action: 'idle' },
            { time: 3.5, x: 44, y: 14, heading: 270, action: 'cut' },
            { time: 5.5, x: 46, y: 13, heading: 0, action: 'catch' },
            { time: 8.5, x: 48, y: 12.5, heading: 0, action: 'shoot' }
          ]
        },
        // Obrońcy
        {
          id: 'D1',
          number: 1,
          name: 'D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 50, y: 7, heading: 0, action: 'defend' },
            { time: 8.5, x: 50, y: 7, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 36, y: 42, heading: 0, action: 'defend' },
            { time: 4.5, x: 68, y: 56, heading: 45, action: 'defend' },
            { time: 8.5, x: 68, y: 56, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 64, y: 42, heading: 0, action: 'defend' },
            { time: 8.5, x: 52, y: 32, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 36, y: 24, heading: 0, action: 'defend' },
            { time: 8.5, x: 46, y: 18, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 64, y: 24, heading: 0, action: 'defend' },
            { time: 3.5, x: 52, y: 18, heading: 0, action: 'defend' },
            { time: 8.5, x: 52, y: 18, heading: 0, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 50, y: 2, holderId: 'O1' },
          { time: 1.5, x: 50, y: 2, holderId: 'O1' },
          { time: 4.5, x: 50, y: 2, holderId: 'O1' },
          { time: 5.5, x: 44, y: 14, holderId: 'O5', isPass: true, arcHeight: 0.1 },
          { time: 6.5, x: 46, y: 13, holderId: 'O5' },
          { time: 7.2, x: 50, y: 12.5, holderId: null, isShot: true, arcHeight: 0.15 },
          { time: 8.5, x: 50, y: 12.5, holderId: null }
        ]
      }
    }
  },

  // ==========================================
  // 4. AUT Z BOKU – ZASŁONA DLA STRZELCA W ROGU
  // ==========================================
  {
    name: 'Aut z boku – zasłona dla strzelca w rogu (Hammer)',
    legacyName: 'SLOB Hammer (Aut boczny ze ścięciem)',
    category: 'slob',
    targetDefense: 'Obrona każdy swego',
    description: 'Wprowadzenie piłki z autu z boku. 2 (rzucający obrońca) wjeżdża z piłką wzdłuż linii końcowej i ściąga pomoc obrony, a 4 (silny skrzydłowy) stawia zasłonę dla 3 (niski skrzydłowy), który dostaje piłkę na rzut za 3 z rogu.',
    tags: ['Aut z boku', 'Zasłona dla strzelca', 'Rzut z rogu', 'Rzut za 3'],
    diagramData: {
      duration: 8.5,
      outcomeText: 'Celny rzut za 3: zawodnik 3 (niski skrzydłowy) • +3 pkt',
      coachingKeys: [
        'Wprowadź piłkę do 2 (rzucający obrońca), który wjeżdża pod kosz',
        'Zasłona 4 (silny skrzydłowy) musi odciąć obrońcę D3 w rogu boiska',
        'Podanie wzdłuż linii końcowej idzie prosto w ręce 3 (niski skrzydłowy)'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie przy linii bocznej',
          description: 'Podający 1 (rozgrywający) stoi za linią boczną. 2 (rzucający obrońca) przygotowuje się do odbioru piłki na prawym skrzydle.',
          coachingCues: ['Pewny chwyt', 'Mocny pierwszy krok']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Wjazd 2 pod kosz i zasłona 4 dla 3',
          description: '2 (rzucający obrońca) wjeżdża z piłką wzdłuż linii końcowej. Po drugiej stronie 4 (silny skrzydłowy) stawia zasłonę dla 3 (niski skrzydłowy). D3 wpada na zasłonę.',
          coachingCues: ['Zasłona plecami do kosza', 'Sprint do rogu']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Podanie wzdłuż linii końcowej do 3',
          description: '2 (rzucający obrońca) spod linii końcowej podaje mocno nad obrońcami prosto w lewy róg do 3 (niski skrzydłowy).',
          coachingCues: ['Podanie w tempo', '3 gotowy do rzutu']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Rzut za 3 z rogu i zbiórka',
          description: '3 (niski skrzydłowy) trafia czysty rzut za 3 (+3 pkt). Wysocy zawodnicy pilnują zbiórki.',
          coachingCues: ['Rzut od razu po chwycie', 'Zbiórka w ataku']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 1,
          name: '1 (rozgrywający)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 98, y: 60, heading: 270, action: 'idle' },
            { time: 2.0, x: 82, y: 75, heading: 0, action: 'idle' },
            { time: 8.5, x: 82, y: 75, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 2,
          name: '2 (rzucający obrońca)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 75, y: 68, heading: 90, action: 'idle' },
            { time: 2.0, x: 75, y: 68, heading: 180, action: 'catch' },
            { time: 5.0, x: 78, y: 20, heading: 0, action: 'dribble' },
            { time: 8.5, x: 78, y: 20, heading: 270, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 3,
          name: '3 (niski skrzydłowy)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 22, y: 65, heading: 0, action: 'idle' },
            { time: 3.5, x: 18, y: 48, heading: 0, action: 'cut' },
            { time: 4.5, x: 10, y: 16, heading: 270, action: 'cut' },
            { time: 5.8, x: 10, y: 16, heading: 90, action: 'catch' },
            { time: 6.5, x: 10, y: 16, heading: 90, action: 'shoot' },
            { time: 8.5, x: 10, y: 16, heading: 90, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 4,
          name: '4 (silny skrzydłowy)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 26, y: 30, heading: 0, action: 'idle' },
            { time: 3.5, x: 18, y: 26, heading: 180, action: 'set_screen' },
            { time: 8.5, x: 18, y: 26, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O5',
          number: 5,
          name: '5 (środkowy)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 60, y: 42, heading: 0, action: 'idle' },
            { time: 4.5, x: 50, y: 20, heading: 0, action: 'idle' },
            { time: 8.5, x: 50, y: 20, heading: 0, action: 'roll' }
          ]
        },
        // Obrońcy
        {
          id: 'D1',
          number: 1,
          name: 'D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 92, y: 60, heading: 90, action: 'defend' },
            { time: 8.5, x: 82, y: 70, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 72, y: 62, heading: 90, action: 'defend' },
            { time: 5.0, x: 76, y: 24, heading: 0, action: 'defend' },
            { time: 8.5, x: 76, y: 24, heading: 270, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 22, y: 58, heading: 180, action: 'defend' },
            { time: 3.5, x: 18, y: 28, heading: 180, action: 'defend' },
            { time: 8.5, x: 18, y: 28, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 26, y: 24, heading: 180, action: 'defend' },
            { time: 8.5, x: 24, y: 26, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 58, y: 36, heading: 180, action: 'defend' },
            { time: 4.5, x: 60, y: 22, heading: 90, action: 'defend' },
            { time: 8.5, x: 60, y: 22, heading: 90, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 98, y: 60, holderId: 'O1' },
          { time: 1.5, x: 75, y: 68, holderId: 'O2', isPass: true, arcHeight: 0.2 },
          { time: 5.0, x: 78, y: 20, holderId: 'O2' },
          { time: 5.8, x: 10, y: 16, holderId: 'O3', isPass: true, arcHeight: 0.3 },
          { time: 6.5, x: 10, y: 16, holderId: 'O3' },
          { time: 7.5, x: 50, y: 12.5, holderId: null, isShot: true, arcHeight: 1.1 },
          { time: 8.5, x: 50, y: 12.5, holderId: null }
        ]
      }
    }
  },

  // ==========================================
  // 5. PO CZASIE – DRZWI WINDY
  // ==========================================
  {
    name: 'Po czasie – drzwi windy (Elevator Doors)',
    legacyName: 'Elevator Doors ATO (Zasłona Windowa)',
    category: 'ato',
    targetDefense: 'Obrona każdy swego (końcówka meczu)',
    description: 'Zagrywka po wziętym czasie. 2 (rzucający obrońca) biegnie środkiem między 4 (silny skrzydłowy) i 5 (środkowy), którzy zaraz za nim zamykają przejście jak drzwi windy i blokują goniącego D2. 2 rzuca za 3 ze szczytu łuku.',
    tags: ['Po czasie', 'Podwójna zasłona', 'Końcówka meczu', 'Rzut za 3'],
    diagramData: {
      duration: 8.5,
      outcomeText: 'Celny rzut za 3: zawodnik 2 (rzucający obrońca) • +3 pkt',
      coachingKeys: [
        '4 (silny skrzydłowy) i 5 (środkowy) zamykają przejście dokładnie wtedy, gdy przebiegnie 2 (rzucający obrońca)',
        'Podanie od 1 (rozgrywający) idzie od razu, prosto na klatkę piersiową 2',
        '2 bez obrońcy oddaje czysty rzut za 3'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie po wziętym czasie',
          description: '1 (rozgrywający) z piłką na lewym skrzydle. 2 (rzucający obrońca) czeka pod koszem, a 4 (silny skrzydłowy) i 5 (środkowy) stoją na szczycie z przerwą między sobą („otwarte drzwi”).',
          coachingCues: ['Pełne skupienie', 'Wysocy gotowi zamknąć przejście']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Sprint 2 i zamknięcie „drzwi windy”',
          description: '2 (rzucający obrońca) sprintuje środkiem. Gdy tylko przebiegnie, 4 i 5 stają ramię w ramię i zamykają przejście. Goniący D2 wpada na podwójną zasłonę.',
          coachingCues: ['Podwójna zasłona', 'D2 całkowicie odcięty']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Podanie na szczyt łuku do 2',
          description: '1 (rozgrywający) podaje prosto na klatkę piersiową 2 (rzucający obrońca), który wybiega na wolne miejsce na szczycie łuku.',
          coachingCues: ['Mocne podanie', 'Ustaw się do rzutu']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Rzut za 3 przez 2 (+3 pkt)',
          description: '2 (rzucający obrońca) bez presji rzuca za 3. Piłka czysto wpada do kosza (+3 pkt).',
          coachingCues: ['Czysty rzut', 'Szybki powrót do obrony']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 1,
          name: '1 (rozgrywający)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 22, y: 75, heading: 90, action: 'idle' },
            { time: 8.5, x: 22, y: 75, heading: 90, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 2,
          name: '2 (rzucający obrońca)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 24, heading: 0, action: 'idle' },
            { time: 1.5, x: 50, y: 24, heading: 0, action: 'idle' },
            { time: 3.5, x: 50, y: 50, heading: 0, action: 'cut' },
            { time: 5.5, x: 50, y: 78, heading: 270, action: 'catch' },
            { time: 6.5, x: 50, y: 78, heading: 0, action: 'shoot' },
            { time: 8.5, x: 50, y: 78, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 3,
          name: '3 (niski skrzydłowy)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 80, y: 68, heading: 270, action: 'idle' },
            { time: 8.5, x: 85, y: 65, heading: 270, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 4,
          name: '4 (silny skrzydłowy)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 42, y: 62, heading: 0, action: 'idle' },
            { time: 2.5, x: 42, y: 62, heading: 0, action: 'idle' },
            { time: 3.5, x: 47, y: 62, heading: 90, action: 'set_screen' },
            { time: 8.5, x: 47, y: 62, heading: 90, action: 'set_screen' }
          ]
        },
        {
          id: 'O5',
          number: 5,
          name: '5 (środkowy)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 58, y: 62, heading: 0, action: 'idle' },
            { time: 2.5, x: 58, y: 62, heading: 0, action: 'idle' },
            { time: 3.5, x: 53, y: 62, heading: 270, action: 'set_screen' },
            { time: 8.5, x: 53, y: 62, heading: 270, action: 'set_screen' }
          ]
        },
        // Obrońcy
        {
          id: 'D1',
          number: 1,
          name: 'D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 26, y: 70, heading: 270, action: 'defend' },
            { time: 8.5, x: 26, y: 70, heading: 270, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 50, y: 28, heading: 0, action: 'defend' },
            { time: 3.0, x: 50, y: 54, heading: 0, action: 'defend' },
            { time: 4.5, x: 50, y: 56, heading: 0, action: 'defend' },
            { time: 8.5, x: 50, y: 56, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 78, y: 65, heading: 90, action: 'defend' },
            { time: 8.5, x: 80, y: 60, heading: 90, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 42, y: 54, heading: 180, action: 'defend' },
            { time: 8.5, x: 44, y: 56, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 58, y: 54, heading: 180, action: 'defend' },
            { time: 8.5, x: 56, y: 56, heading: 180, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 22, y: 75, holderId: 'O1' },
          { time: 4.5, x: 22, y: 75, holderId: 'O1' },
          { time: 5.5, x: 50, y: 78, holderId: 'O2', isPass: true, arcHeight: 0.2 },
          { time: 6.5, x: 50, y: 78, holderId: 'O2' },
          { time: 7.5, x: 50, y: 12.5, holderId: null, isShot: true, arcHeight: 1.1 },
          { time: 8.5, x: 50, y: 12.5, holderId: null }
        ]
      }
    }
  },

  // =========================================================================
  // 6. OBRONA KAŻDY SWEGO – POMOC I POWRÓT (OBRONA)
  // =========================================================================
  {
    name: 'Obrona każdy swego – pomoc i powrót (Help and Recover)',
    legacyName: 'Obrona Każdy Swego 1vs1 (Help & Recover)',
    category: 'defense',
    targetDefense: 'Atak pozycyjny (zasłony i ruch bez piłki)',
    description: 'Agresywna obrona każdy swego oparta na zasadzie „pomoc i powrót”. Naciskamy zawodnika z piłką, zamykamy najbliższe podania, obrońca z drugiej strony pomaga na środku, a po podaniu szybko doskakujemy do rywala i zbieramy piłkę z tablicy.',
    tags: ['Obrona każdy swego', 'Pomoc i powrót', 'Pomoc ze środka', 'Zbiórka w obronie'],
    diagramData: {
      duration: 8.5,
      outcomeText: 'Skuteczna obrona: trudny rzut rywala i zbiórka D5',
      coachingKeys: [
        'Obrońca zawodnika z piłką (D1) stoi nisko, naciska i nie puszcza go środkiem',
        'Obrońcy zawodników o jedno podanie od piłki (D2, D3) trzymają rękę w linii podania',
        'Obrońca z drugiej strony (D3) schodzi na środek linii rzutów wolnych i zamyka wjazd',
        'Doskok do rywala z ręką w górze, a po pomocy szybki powrót do swojego zawodnika'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 2.0,
          title: 'Faza 1: Nacisk na zawodnika z piłką i zamknięcie podań na skrzydła',
          description: 'O1 ma piłkę na szczycie łuku. D1 mocno naciska na kozłującego. D2 i D3 stoją w linii podania i nie pozwalają łatwo podać na skrzydła.',
          coachingCues: ['Nisko na nogach', 'Ręka w linii podania']
        },
        {
          startTime: 2.0,
          endTime: 4.2,
          title: 'Faza 2: Wjazd O1 i pomoc D3 ze środka',
          description: 'O1 próbuje wjechać w prawo. D3 schodzi z lewego skrzydła na środek linii rzutów wolnych i zamyka drogę. O1 odgrywa na skrzydło do O2.',
          coachingCues: ['Pomoc ze środka zatrzymuje kozłującego', 'Mów do partnerów']
        },
        {
          startTime: 4.2,
          endTime: 6.5,
          title: 'Faza 3: Doskok D2, przerzut piłki do O3 i powrót D3',
          description: 'D2 doskakuje do O2. O2 podaje przez całe boisko do O3. D3 błyskawicznie wraca i doskakuje do O3 dokładnie na czas.',
          coachingCues: ['Drobne kroki przy doskoku', 'Bez faulu przy wyskoku']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Trudny rzut pod presją i zbiórka D5',
          description: 'Kończy się czas na akcję (24 s), więc O3 musi rzucać przez ręce D3. Piłka odbija się od obręczy, D5 zastawia rywala plecami i zbiera piłkę.',
          coachingCues: ['Zastaw rywala plecami', 'Zbiórka oburącz w wyskoku']
        }
      ],
      players: [
        // Atakujący
        {
          id: 'O1',
          number: 1,
          name: '1 (rozgrywający)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 78, heading: 0, action: 'dribble' },
            { time: 2.0, x: 56, y: 64, heading: 45, action: 'dribble' },
            { time: 3.2, x: 52, y: 68, heading: 90, action: 'idle' },
            { time: 8.5, x: 50, y: 72, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 2,
          name: '2 (rzucający obrońca)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 82, y: 60, heading: 270, action: 'idle' },
            { time: 3.2, x: 82, y: 56, heading: 270, action: 'catch' },
            { time: 4.8, x: 82, y: 56, heading: 270, action: 'idle' },
            { time: 8.5, x: 80, y: 56, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 3,
          name: '3 (niski skrzydłowy)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 18, y: 60, heading: 90, action: 'idle' },
            { time: 4.8, x: 16, y: 56, heading: 90, action: 'idle' },
            { time: 5.5, x: 16, y: 56, heading: 90, action: 'catch' },
            { time: 6.6, x: 16, y: 56, heading: 45, action: 'shoot' },
            { time: 8.5, x: 16, y: 56, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 4,
          name: '4 (silny skrzydłowy)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 26, y: 28, heading: 0, action: 'idle' },
            { time: 5.0, x: 30, y: 22, heading: 0, action: 'idle' },
            { time: 8.5, x: 36, y: 16, heading: 0, action: 'cut' }
          ]
        },
        {
          id: 'O5',
          number: 5,
          name: '5 (środkowy)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 74, y: 28, heading: 0, action: 'idle' },
            { time: 5.0, x: 70, y: 22, heading: 0, action: 'idle' },
            { time: 8.5, x: 64, y: 16, heading: 0, action: 'cut' }
          ]
        },
        // Obrońcy (każdy swego)
        {
          id: 'D1',
          number: 1,
          name: 'D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 50, y: 72, heading: 180, action: 'defend' },
            { time: 2.0, x: 54, y: 58, heading: 180, action: 'defend' },
            { time: 3.5, x: 50, y: 62, heading: 140, action: 'defend' },
            { time: 8.5, x: 48, y: 64, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 76, y: 58, heading: 180, action: 'defend' },
            { time: 3.2, x: 78, y: 50, heading: 90, action: 'defend' }, // Closeout na O2
            { time: 5.0, x: 68, y: 52, heading: 240, action: 'defend' }, // Przesunięcie asekuracyjne
            { time: 8.5, x: 66, y: 48, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 24, y: 58, heading: 180, action: 'defend' },
            { time: 2.0, x: 40, y: 54, heading: 90, action: 'defend' }, // Nail Help!
            { time: 4.8, x: 22, y: 52, heading: 270, action: 'defend' }, // Recover sprint!
            { time: 6.6, x: 20, y: 50, heading: 270, action: 'defend' }, // Closeout z blokiem
            { time: 8.5, x: 20, y: 46, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 30, y: 24, heading: 180, action: 'defend' },
            { time: 3.5, x: 36, y: 24, heading: 90, action: 'defend' },
            { time: 6.5, x: 38, y: 16, heading: 0, action: 'defend' },
            { time: 8.5, x: 40, y: 14, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 68, y: 24, heading: 180, action: 'defend' },
            { time: 3.5, x: 58, y: 24, heading: 270, action: 'defend' },
            { time: 6.5, x: 54, y: 16, heading: 0, action: 'defend' },
            { time: 8.5, x: 50, y: 14, heading: 0, action: 'defend' } // Pewna zbiórka!
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 50, y: 78, holderId: 'O1' },
          { time: 2.0, x: 56, y: 64, holderId: 'O1' },
          { time: 2.8, x: 52, y: 68, holderId: 'O1' },
          { time: 3.5, x: 82, y: 56, holderId: 'O2', isPass: true, arcHeight: 0.2 },
          { time: 4.8, x: 82, y: 56, holderId: 'O2' },
          { time: 5.5, x: 16, y: 56, holderId: 'O3', isPass: true, arcHeight: 0.3 }, // Skip pass przez całe boisko!
          { time: 6.6, x: 16, y: 56, holderId: 'O3' },
          { time: 7.3, x: 50, y: 12.5, holderId: null, isShot: true, arcHeight: 1.2 }, // Rzut o obręcz
          { time: 7.9, x: 52, y: 16, holderId: null, isPass: true, arcHeight: 0.3 }, // Odbicie
          { time: 8.5, x: 50, y: 14, holderId: 'D5' } // Chwyt piłki przez D5!
        ]
      }
    }
  },

  // =========================================================================
  // 7. STREFA 2-3 – PRZESUNIĘCIA I ZAMYKANIE ROGÓW (OBRONA)
  // =========================================================================
  {
    name: 'Strefa 2-3 – przesunięcia i zamykanie rogów',
    legacyName: 'Obrona Strefowa 2-3 (Przesunięcia & Zastawienie Rogów)',
    category: 'defense',
    targetDefense: 'Drużyny rzucające z dystansu i wjeżdżające pod kosz',
    description: 'Klasyczna obrona strefowa 2-3 z pięcioma wyraźnie zaznaczonymi strefami odpowiedzialności. Obrońcy przesuwają się razem za piłką wokół łuku (lewe skrzydło → szczyt łuku → prawe skrzydło → prawy róg), zagęszczają stronę z piłką i odcinają podania pod kosz.',
    tags: ['Strefa 2-3', 'Obrona strefowa', 'Przesunięcia w strefie', 'Ochrona kosza', 'Strefy odpowiedzialności'],
    diagramData: {
      duration: 8.5,
      outcomeText: 'Strefa 2-3: zgrane przesunięcie i przechwyt D5',
      zoneAreas: [
        {
          id: 'Z_D1',
          playerId: 'D1',
          label: 'D1: lewy szczyt',
          color: 'rgba(239, 23, 52, 0.14)',
          polygon: [{ x: 6, y: 50 }, { x: 50, y: 50 }, { x: 50, y: 92 }, { x: 6, y: 92 }]
        },
        {
          id: 'Z_D2',
          playerId: 'D2',
          label: 'D2: prawy szczyt',
          color: 'rgba(216, 212, 204, 0.10)',
          polygon: [{ x: 50, y: 50 }, { x: 94, y: 50 }, { x: 94, y: 92 }, { x: 50, y: 92 }]
        },
        {
          id: 'Z_D3',
          playerId: 'D3',
          label: 'D3: lewy róg i skrzydło',
          color: 'rgba(61, 186, 111, 0.12)',
          polygon: [{ x: 4, y: 4 }, { x: 36, y: 4 }, { x: 36, y: 50 }, { x: 4, y: 50 }]
        },
        {
          id: 'Z_D4',
          playerId: 'D4',
          label: 'D4: prawy róg i skrzydło',
          color: 'rgba(255, 90, 110, 0.12)',
          polygon: [{ x: 64, y: 4 }, { x: 96, y: 4 }, { x: 96, y: 50 }, { x: 64, y: 50 }]
        },
        {
          id: 'Z_D5',
          playerId: 'D5',
          label: 'D5: pod koszem i tablica',
          color: 'rgba(156, 151, 143, 0.12)',
          polygon: [{ x: 36, y: 4 }, { x: 64, y: 4 }, { x: 64, y: 50 }, { x: 36, y: 50 }]
        }
      ],
      coachingKeys: [
        'Piłka krąży wokół łuku (lewe skrzydło → szczyt → prawe skrzydło → róg), a cała strefa przesuwa się razem z nią',
        'Podanie na prawe skrzydło: D2 doskakuje do piłki, D1 schodzi na środek linii rzutów wolnych, D4 podchodzi wyżej',
        'Podanie do rogu: D4 od razu doskakuje do rogu, D5 pilnuje linii końcowej',
        'Środkowy D5 w polu trzech sekund pilnuje podań pod kosz i przecina je w powietrzu'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.8,
          title: 'Faza 1: Piłka na lewym skrzydle (O3) – zagęszczenie lewej strony',
          description: 'O3 ma piłkę na lewym skrzydle. D1 doskakuje na lewą stronę szczytu, D3 pilnuje skrzydła, D2 schodzi na środek linii rzutów wolnych, D5 pilnuje lewej strony pod koszem, D4 zabezpiecza drugą stronę.',
          coachingCues: ['Zagęść lewą stronę', 'D2 na środku zamyka drogę']
        },
        {
          startTime: 1.8,
          endTime: 4.2,
          title: 'Faza 2: Przerzut piłki przez szczyt (O1) na prawe skrzydło (O2)',
          description: 'O3 odgrywa do O1, a O1 szybko przerzuca piłkę na prawe skrzydło do O2. Cała strefa 2-3 przesuwa się razem w prawo: D2 doskakuje do O2, D1 schodzi na środek, D4 podchodzi na skrzydło, D5 przechodzi na prawą stronę pod koszem, D3 pod kosz.',
          coachingCues: ['Cała piątka przesuwa się razem', 'Nie zostawiaj miejsca na rzut']
        },
        {
          startTime: 4.2,
          endTime: 6.2,
          title: 'Faza 3: Podanie do prawego rogu (O4) i zamknięcie linii końcowej',
          description: 'O2 podaje do O4 w róg. D4 sprintuje i zamyka róg, D5 odcina drogę wzdłuż linii końcowej, D2 cofa się na róg pola trzech sekund, D1 i D3 pilnują środka.',
          coachingCues: ['Dwóch obrońców zamyka róg', 'Ręce w górze, bez faulu']
        },
        {
          startTime: 6.2,
          endTime: 8.5,
          title: 'Faza 4: Wymuszone podanie pod kosz i przechwyt D5',
          description: 'Odcięty w rogu O4 próbuje ryzykownego podania pod kosz. D5 to wyczuwa, przechwytuje piłkę w wyskoku i rusza z szybkim atakiem.',
          coachingCues: ['Pilnuj pola trzech sekund', 'Szybko wyprowadź kontratak']
        }
      ],
      players: [
        // Atak
        {
          id: 'O1',
          number: 1,
          name: '1 (rozgrywający)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 80, heading: 270, action: 'idle' },
            { time: 2.2, x: 50, y: 80, heading: 270, action: 'catch' },
            { time: 3.2, x: 50, y: 80, heading: 90, action: 'idle' },
            { time: 8.5, x: 50, y: 80, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 2,
          name: '2 (rzucający obrońca)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 82, y: 64, heading: 270, action: 'idle' },
            { time: 3.8, x: 82, y: 64, heading: 270, action: 'catch' },
            { time: 4.8, x: 82, y: 64, heading: 180, action: 'idle' },
            { time: 8.5, x: 80, y: 62, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 3,
          name: '3 (niski skrzydłowy)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 18, y: 64, heading: 90, action: 'dribble' },
            { time: 1.6, x: 18, y: 64, heading: 90, action: 'idle' },
            { time: 8.5, x: 18, y: 60, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 4,
          name: '4 (silny skrzydłowy)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 90, y: 20, heading: 270, action: 'idle' },
            { time: 5.2, x: 90, y: 16, heading: 270, action: 'catch' },
            { time: 6.2, x: 90, y: 16, heading: 220, action: 'idle' },
            { time: 8.5, x: 90, y: 16, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O5',
          number: 5,
          name: '5 (środkowy)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 42, y: 34, heading: 90, action: 'idle' },
            { time: 4.5, x: 56, y: 28, heading: 90, action: 'cut' },
            { time: 8.5, x: 54, y: 24, heading: 0, action: 'idle' }
          ]
        },
        // Obrońcy strefy 2-3 z przesunięciami
        {
          id: 'D1',
          number: 1,
          name: 'D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 34, y: 66, heading: 270, action: 'defend' }, // Lewy szczyt
            { time: 2.2, x: 46, y: 72, heading: 180, action: 'defend' }, // Doskok do O1
            { time: 4.0, x: 50, y: 58, heading: 120, action: 'defend' }, // Nail Help
            { time: 8.5, x: 48, y: 52, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 54, y: 62, heading: 240, action: 'defend' }, // Nail lewa strona
            { time: 2.2, x: 62, y: 68, heading: 180, action: 'defend' },
            { time: 4.0, x: 76, y: 62, heading: 90, action: 'defend' },  // Doskok do O2 na skrzydle
            { time: 5.5, x: 68, y: 46, heading: 140, action: 'defend' }, // Łokieć trumny
            { time: 8.5, x: 68, y: 46, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 22, y: 52, heading: 270, action: 'defend' }, // Lewe skrzydło pod piłką
            { time: 3.5, x: 30, y: 32, heading: 90, action: 'defend' },
            { time: 5.5, x: 36, y: 20, heading: 90, action: 'defend' }, // Weak-side drop pod kosz
            { time: 8.5, x: 36, y: 20, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 68, y: 22, heading: 270, action: 'defend' }, // Weak-side drop
            { time: 3.5, x: 80, y: 44, heading: 90, action: 'defend' },  // Podbicie w prawe skrzydło
            { time: 5.5, x: 88, y: 20, heading: 90, action: 'defend' },  // Zamknięcie prawego rogu
            { time: 8.5, x: 88, y: 20, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 44, y: 24, heading: 270, action: 'defend' }, // Lewy blok
            { time: 3.5, x: 52, y: 24, heading: 180, action: 'defend' }, // Środek
            { time: 5.5, x: 62, y: 18, heading: 90, action: 'defend' },  // Zabezpieczenie linii końcowej
            { time: 6.8, x: 56, y: 24, heading: 45, action: 'defend' },  // Przechwyt podania!
            { time: 8.5, x: 50, y: 34, heading: 0, action: 'dribble' }  // Kontratak!
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 18, y: 64, holderId: 'O3' },
          { time: 1.6, x: 18, y: 64, holderId: 'O3' },
          { time: 2.2, x: 50, y: 80, holderId: 'O1', isPass: true, arcHeight: 0.2 },
          { time: 3.2, x: 50, y: 80, holderId: 'O1' },
          { time: 3.8, x: 82, y: 64, holderId: 'O2', isPass: true, arcHeight: 0.2 },
          { time: 4.8, x: 82, y: 64, holderId: 'O2' },
          { time: 5.2, x: 90, y: 16, holderId: 'O4', isPass: true, arcHeight: 0.2 },
          { time: 6.2, x: 90, y: 16, holderId: 'O4' },
          { time: 6.8, x: 56, y: 24, holderId: 'D5', isPass: true, arcHeight: 0.15 }, // Przechwyt D5!
          { time: 8.5, x: 50, y: 34, holderId: 'D5' }
        ]
      }
    }
  },

  // =========================================================================
  // 8. STREFA 3-2 – MUR NA OBWODZIE I ROTACJE (OBRONA)
  // =========================================================================
  {
    name: 'Strefa 3-2 – mur na obwodzie i rotacje pod koszem',
    legacyName: 'Obrona Strefowa 3-2 (Odcięcie Obwodu & Rotacje)',
    category: 'defense',
    targetDefense: 'Drużyny, które dużo rzucają za 3',
    description: 'Agresywna strefa 3-2, która ma przede wszystkim zablokować rzuty za 3. Trzech górnych obrońców (D1, D2, D3) tworzy mur na łuku i przesuwa się za piłką, a dwóch wysokich (D4, D5) rotuje pod koszem i pilnuje zbiórki.',
    tags: ['Strefa 3-2', 'Obrona strefowa', 'Zamknięcie rzutów za 3', 'Mur na obwodzie', 'Blok'],
    diagramData: {
      duration: 8.5,
      outcomeText: 'Strefa 3-2: szczelny mur na łuku i blok rzutu za 3 (D2)',
      zoneAreas: [
        {
          id: 'Z_D1',
          playerId: 'D1',
          label: 'D1: szczyt łuku',
          color: 'rgba(239, 23, 52, 0.14)',
          polygon: [{ x: 30, y: 64 }, { x: 70, y: 64 }, { x: 70, y: 94 }, { x: 30, y: 94 }]
        },
        {
          id: 'Z_D2',
          playerId: 'D2',
          label: 'D2: prawe skrzydło',
          color: 'rgba(216, 212, 204, 0.10)',
          polygon: [{ x: 64, y: 38 }, { x: 96, y: 38 }, { x: 96, y: 80 }, { x: 64, y: 80 }]
        },
        {
          id: 'Z_D3',
          playerId: 'D3',
          label: 'D3: lewe skrzydło',
          color: 'rgba(61, 186, 111, 0.12)',
          polygon: [{ x: 4, y: 38 }, { x: 36, y: 38 }, { x: 36, y: 80 }, { x: 4, y: 80 }]
        },
        {
          id: 'D4',
          playerId: 'D4',
          label: 'D4: prawy dół i róg',
          color: 'rgba(255, 90, 110, 0.12)',
          polygon: [{ x: 50, y: 4 }, { x: 96, y: 4 }, { x: 96, y: 38 }, { x: 50, y: 38 }]
        },
        {
          id: 'D5',
          playerId: 'D5',
          label: 'D5: lewy dół i róg',
          color: 'rgba(156, 151, 143, 0.12)',
          polygon: [{ x: 4, y: 4 }, { x: 50, y: 4 }, { x: 50, y: 38 }, { x: 4, y: 38 }]
        }
      ],
      coachingKeys: [
        'Trzech górnych obrońców (D1, D2, D3) ciasno pilnuje łuku – nie ma miejsca na rzut za 3',
        'Piłka idzie z lewego skrzydła przez szczyt na prawe skrzydło – górna trójka przesuwa się jak jedna ściana',
        'Gdy rywal rzuca przez ręce, D2 wyskakuje pionowo i blokuje',
        'D4 i D5 pilnują strefy pod koszem i zbiórki'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.8,
          title: 'Faza 1: Piłka na lewym skrzydle (O3) i doskok D3',
          description: 'O3 ma piłkę na lewym skrzydle. D3 od razu doskakuje, D1 pilnuje lewego rogu pola trzech sekund, D2 schodzi na środek, D5 pilnuje strefy pod koszem.',
          coachingCues: ['Wysoko ręce na obwodzie', 'Górna trójka blisko siebie']
        },
        {
          startTime: 1.8,
          endTime: 4.0,
          title: 'Faza 2: Podanie na szczyt (O1) i mur górnej trójki',
          description: 'O3 odgrywa do O1 na szczyt łuku. D1 od razu wychodzi do piłki, D2 i D3 stają szeroko na skrzydłach i zamykają rzuty za 3.',
          coachingCues: ['Nie zostawiaj miejsca na rzut', 'Szybkie przesunięcie górnej trójki']
        },
        {
          startTime: 4.0,
          endTime: 6.2,
          title: 'Faza 3: Przerzut piłki na prawe skrzydło (O2) i doskok D2',
          description: 'O1 podaje do O2 na prawe skrzydło. D2 sprintem doskakuje, D1 przesuwa się na prawy róg pola trzech sekund, D4 pilnuje prawej strony pod koszem.',
          coachingCues: ['Sprint w obronie', 'Wyskok pionowy, bez kontaktu']
        },
        {
          startTime: 6.2,
          endTime: 8.5,
          title: 'Faza 4: Blok rzutu za 3 przez D2 i zbiórka D4',
          description: 'O2 rzuca z dystansu, ale D2 blokuje piłkę w powietrzu. Odbitą piłkę pod koszem zbiera D4.',
          coachingCues: ['Czysty blok czubkami palców', 'Zabierz bezpańską piłkę']
        }
      ],
      players: [
        // Atak
        {
          id: 'O1',
          number: 1,
          name: '1 (rozgrywający)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 82, heading: 270, action: 'idle' },
            { time: 2.2, x: 50, y: 82, heading: 270, action: 'catch' },
            { time: 3.8, x: 50, y: 82, heading: 90, action: 'idle' },
            { time: 8.5, x: 50, y: 80, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 2,
          name: '2 (rzucający obrońca)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 80, y: 64, heading: 270, action: 'idle' },
            { time: 4.5, x: 82, y: 62, heading: 270, action: 'catch' },
            { time: 6.2, x: 82, y: 62, heading: 0, action: 'shoot' },
            { time: 8.5, x: 82, y: 62, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 3,
          name: '3 (niski skrzydłowy)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 20, y: 64, heading: 90, action: 'dribble' },
            { time: 1.6, x: 20, y: 64, heading: 90, action: 'idle' },
            { time: 8.5, x: 18, y: 62, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 4,
          name: '4 (silny skrzydłowy)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 84, y: 22, heading: 0, action: 'idle' },
            { time: 8.5, x: 74, y: 16, heading: 0, action: 'cut' }
          ]
        },
        {
          id: 'O5',
          number: 5,
          name: '5 (środkowy)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 16, y: 22, heading: 0, action: 'idle' },
            { time: 8.5, x: 26, y: 16, heading: 0, action: 'cut' }
          ]
        },
        // Obrońcy strefy 3-2
        {
          id: 'D1',
          number: 1,
          name: 'D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 38, y: 68, heading: 240, action: 'defend' }, // Lewy łokieć
            { time: 2.2, x: 50, y: 75, heading: 180, action: 'defend' }, // Doskok do szczytu
            { time: 4.5, x: 62, y: 70, heading: 120, action: 'defend' }, // Prawy łokieć
            { time: 8.5, x: 56, y: 68, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 62, y: 56, heading: 240, action: 'defend' }, // Środek
            { time: 2.2, x: 72, y: 66, heading: 180, action: 'defend' }, // Prawe skrzydło
            { time: 4.5, x: 76, y: 60, heading: 90, action: 'defend' },  // Doskok w closeoucie
            { time: 6.4, x: 78, y: 60, heading: 90, action: 'defend' },  // Blok rzutu w powietrzu!
            { time: 8.5, x: 76, y: 58, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 22, y: 60, heading: 270, action: 'defend' }, // Doskok na lewym skrzydle
            { time: 2.2, x: 28, y: 66, heading: 180, action: 'defend' }, // Lewe skrzydło
            { time: 4.5, x: 38, y: 58, heading: 140, action: 'defend' }, // Środek
            { time: 8.5, x: 36, y: 50, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 58, y: 22, heading: 270, action: 'defend' }, // Asekuracja kosza
            { time: 4.5, x: 68, y: 24, heading: 90, action: 'defend' },  // Prawy dół
            { time: 7.0, x: 58, y: 20, heading: 0, action: 'defend' },
            { time: 8.5, x: 54, y: 16, heading: 0, action: 'defend' }   // Zbiórka zablokowanej piłki!
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 30, y: 24, heading: 270, action: 'defend' }, // Lewy dół
            { time: 2.2, x: 36, y: 26, heading: 180, action: 'defend' },
            { time: 4.5, x: 46, y: 20, heading: 90, action: 'defend' },  // Asekuracja kosza
            { time: 8.5, x: 46, y: 16, heading: 0, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 20, y: 64, holderId: 'O3' },
          { time: 1.6, x: 20, y: 64, holderId: 'O3' },
          { time: 2.2, x: 50, y: 82, holderId: 'O1', isPass: true, arcHeight: 0.2 },
          { time: 3.8, x: 50, y: 82, holderId: 'O1' },
          { time: 4.5, x: 82, y: 62, holderId: 'O2', isPass: true, arcHeight: 0.25 },
          { time: 6.2, x: 82, y: 62, holderId: 'O2' },
          { time: 6.4, x: 78, y: 60, holderId: null, isShot: true, arcHeight: 0.2 }, // Rzut zablokowany przez D2 na 78, 60
          { time: 7.4, x: 58, y: 22, holderId: null, isPass: true, arcHeight: 0.4 }, // Zablokowana piłka leci w trumnę
          { time: 8.5, x: 54, y: 16, holderId: 'D4' } // Zabezpieczenie przez D4!
        ]
      }
    }
  },

  // =========================================================================
  // 9. ĆWICZENIE STREFY 2-3: ZASADY PRZESUNIĘĆ
  // =========================================================================
  {
    name: 'Ćwiczenie strefy 2-3: zasady przesunięć',
    legacyName: 'Trening Strefy 2-3: Zasady Przesunięć (Swing Drill)',
    category: 'defense',
    targetDefense: 'Ćwiczenie dla całej drużyny i początkujących',
    description: 'Ćwiczenie obrony strefowej 2-3. Krok po kroku pokazuje ruch każdego z pięciu obrońców (D1–D5), gdy piłka krąży wokół łuku (lewe skrzydło → szczyt łuku → prawe skrzydło → prawy róg → środek). Dobre do nauki zasady „piłka – ja – mój zawodnik” i pomocy ze środka.',
    tags: ['Ćwiczenie strefy', 'Strefa 2-3', 'Ćwiczenie', 'Przesunięcia', 'Poradnik'],
    diagramData: {
      duration: 8.5,
      outcomeText: 'Ćwiczenie strefy 2-3 zakończone • zasady opanowane',
      zoneAreas: [
        {
          id: 'Z_D1',
          playerId: 'D1',
          label: 'D1: lewy szczyt',
          color: 'rgba(239, 23, 52, 0.14)',
          polygon: [{ x: 6, y: 50 }, { x: 50, y: 50 }, { x: 50, y: 92 }, { x: 6, y: 92 }]
        },
        {
          id: 'Z_D2',
          playerId: 'D2',
          label: 'D2: prawy szczyt',
          color: 'rgba(216, 212, 204, 0.10)',
          polygon: [{ x: 50, y: 50 }, { x: 94, y: 50 }, { x: 94, y: 92 }, { x: 50, y: 92 }]
        },
        {
          id: 'Z_D3',
          playerId: 'D3',
          label: 'D3: lewy róg i skrzydło',
          color: 'rgba(61, 186, 111, 0.12)',
          polygon: [{ x: 4, y: 4 }, { x: 36, y: 4 }, { x: 36, y: 50 }, { x: 4, y: 50 }]
        },
        {
          id: 'Z_D4',
          playerId: 'D4',
          label: 'D4: prawy róg i skrzydło',
          color: 'rgba(255, 90, 110, 0.12)',
          polygon: [{ x: 64, y: 4 }, { x: 96, y: 4 }, { x: 96, y: 50 }, { x: 64, y: 50 }]
        },
        {
          id: 'Z_D5',
          playerId: 'D5',
          label: 'D5: pod koszem i tablica',
          color: 'rgba(156, 151, 143, 0.12)',
          polygon: [{ x: 36, y: 4 }, { x: 64, y: 4 }, { x: 64, y: 50 }, { x: 36, y: 50 }]
        }
      ],
      coachingKeys: [
        'Zasada 1: Piłka wyznacza ustawienie całej strefy – widzisz jednocześnie piłkę i swojego zawodnika',
        'Zasada 2: Gdy D1 jest przy piłce, D2 schodzi na środek linii rzutów wolnych',
        'Zasada 3: Dolna linia (D3, D4) podchodzi na skrzydło albo doskakuje do rogu, bez wyskakiwania do przodu',
        'Zasada 4: Środkowy D5 odcina drogę wzdłuż linii końcowej i zamyka wjazdy'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 2.0,
          title: 'Krok 1: Piłka na lewym skrzydle – zagęszczenie lewej strony',
          description: 'O3 ma piłkę. D1 doskakuje na lewą stronę szczytu, D3 pilnuje skrzydła, D2 schodzi na środek linii rzutów wolnych, D5 pilnuje lewej strony pod koszem, D4 cofa się po drugiej stronie.',
          coachingCues: ['D2 na środku zamyka drogę', 'Widzisz piłkę i swojego zawodnika']
        },
        {
          startTime: 2.0,
          endTime: 4.2,
          title: 'Krok 2: Przerzut piłki przez szczyt (O1) na prawe skrzydło (O2)',
          description: 'Piłka idzie przez szczyt łuku do O2. Cała piątka przesuwa się razem w prawo: D2 doskakuje, D1 schodzi na środek, D4 podchodzi wyżej, D5 przechodzi na prawą stronę pod koszem, D3 pod kosz.',
          coachingCues: ['Cała strefa przesuwa się razem', 'Bez dziury w środku']
        },
        {
          startTime: 4.2,
          endTime: 6.2,
          title: 'Krok 3: Podanie do prawego rogu (O4) i zamknięcie rogu',
          description: 'O4 w rogu: D4 zamyka róg z rękami w górze, D5 odcina drogę wzdłuż linii końcowej, D2 cofa się na prawy róg pola trzech sekund, D1 i D3 pilnują strefy pod koszem.',
          coachingCues: ['Dwóch obrońców zamyka róg', 'Ręce w górze, bez faulu']
        },
        {
          startTime: 6.2,
          endTime: 8.5,
          title: 'Krok 4: Wymuszone złe podanie i zbiórka D5',
          description: 'Wszystkie podania odcięte. O4 próbuje ryzykownego podania, D5 przechwytuje piłkę i drużyna odzyskuje posiadanie.',
          coachingCues: ['Czysty przechwyt', 'Zbiórka w obronie']
        }
      ],
      players: [
        // Atak
        {
          id: 'O1',
          number: 1,
          name: '1 (rozgrywający)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 80, heading: 270, action: 'idle' },
            { time: 2.2, x: 50, y: 80, heading: 270, action: 'catch' },
            { time: 3.2, x: 50, y: 80, heading: 90, action: 'idle' },
            { time: 8.5, x: 50, y: 80, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 2,
          name: '2 (rzucający obrońca)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 82, y: 64, heading: 270, action: 'idle' },
            { time: 3.8, x: 82, y: 64, heading: 270, action: 'catch' },
            { time: 4.8, x: 82, y: 64, heading: 180, action: 'idle' },
            { time: 8.5, x: 80, y: 62, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 3,
          name: '3 (niski skrzydłowy)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 18, y: 64, heading: 90, action: 'dribble' },
            { time: 1.6, x: 18, y: 64, heading: 90, action: 'idle' },
            { time: 8.5, x: 18, y: 60, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 4,
          name: '4 (silny skrzydłowy)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 90, y: 20, heading: 270, action: 'idle' },
            { time: 5.2, x: 90, y: 16, heading: 270, action: 'catch' },
            { time: 6.2, x: 90, y: 16, heading: 220, action: 'idle' },
            { time: 8.5, x: 90, y: 16, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O5',
          number: 5,
          name: '5 (środkowy)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 42, y: 34, heading: 90, action: 'idle' },
            { time: 4.5, x: 56, y: 28, heading: 90, action: 'cut' },
            { time: 8.5, x: 54, y: 24, heading: 0, action: 'idle' }
          ]
        },
        // Obrońcy
        {
          id: 'D1',
          number: 1,
          name: 'D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 34, y: 66, heading: 270, action: 'defend' },
            { time: 2.2, x: 46, y: 72, heading: 180, action: 'defend' },
            { time: 4.0, x: 50, y: 58, heading: 120, action: 'defend' },
            { time: 8.5, x: 48, y: 52, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 54, y: 62, heading: 240, action: 'defend' },
            { time: 2.2, x: 62, y: 68, heading: 180, action: 'defend' },
            { time: 4.0, x: 76, y: 62, heading: 90, action: 'defend' },
            { time: 5.5, x: 68, y: 46, heading: 140, action: 'defend' },
            { time: 8.5, x: 68, y: 46, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 22, y: 52, heading: 270, action: 'defend' },
            { time: 3.5, x: 30, y: 32, heading: 90, action: 'defend' },
            { time: 5.5, x: 36, y: 20, heading: 90, action: 'defend' },
            { time: 8.5, x: 36, y: 20, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 68, y: 22, heading: 270, action: 'defend' },
            { time: 3.5, x: 80, y: 44, heading: 90, action: 'defend' },
            { time: 5.5, x: 88, y: 20, heading: 90, action: 'defend' },
            { time: 8.5, x: 88, y: 20, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 44, y: 24, heading: 270, action: 'defend' },
            { time: 3.5, x: 52, y: 24, heading: 180, action: 'defend' },
            { time: 5.5, x: 62, y: 18, heading: 90, action: 'defend' },
            { time: 6.8, x: 56, y: 24, heading: 45, action: 'defend' },
            { time: 8.5, x: 50, y: 34, heading: 0, action: 'dribble' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 18, y: 64, holderId: 'O3' },
          { time: 1.6, x: 18, y: 64, holderId: 'O3' },
          { time: 2.2, x: 50, y: 80, holderId: 'O1', isPass: true, arcHeight: 0.2 },
          { time: 3.2, x: 50, y: 80, holderId: 'O1' },
          { time: 3.8, x: 82, y: 64, holderId: 'O2', isPass: true, arcHeight: 0.2 },
          { time: 4.8, x: 82, y: 64, holderId: 'O2' },
          { time: 5.2, x: 90, y: 16, holderId: 'O4', isPass: true, arcHeight: 0.2 },
          { time: 6.2, x: 90, y: 16, holderId: 'O4' },
          { time: 6.8, x: 56, y: 24, holderId: 'D5', isPass: true, arcHeight: 0.15 },
          { time: 8.5, x: 50, y: 34, holderId: 'D5' }
        ]
      }
    }
  },

  // =========================================================================
  // 10. ĆWICZENIE STREFY 3-2: MUR NA OBWODZIE
  // =========================================================================
  {
    name: 'Ćwiczenie strefy 3-2: mur na obwodzie',
    legacyName: 'Trening Strefy 3-2: Mur Obwodowy (Perimeter Wall Drill)',
    category: 'defense',
    targetDefense: 'Ćwiczenie dla całej drużyny i początkujących',
    description: 'Ćwiczenie obrony strefowej 3-2. Pokazuje, jak górna trójka (D1, D2, D3) tworzy szczelny mur na obwodzie i jak dolni obrońcy (D4, D5) rotują, gdy piłka krąży wokół łuku i trafia do rogów boiska.',
    tags: ['Ćwiczenie strefy', 'Strefa 3-2', 'Ćwiczenie', 'Mur na obwodzie', 'Poradnik'],
    diagramData: {
      duration: 8.5,
      outcomeText: 'Ćwiczenie strefy 3-2 zakończone • obwód zamknięty',
      zoneAreas: [
        {
          id: 'Z_D1',
          playerId: 'D1',
          label: 'D1: szczyt łuku',
          color: 'rgba(239, 23, 52, 0.14)',
          polygon: [{ x: 30, y: 64 }, { x: 70, y: 64 }, { x: 70, y: 94 }, { x: 30, y: 94 }]
        },
        {
          id: 'Z_D2',
          playerId: 'D2',
          label: 'D2: prawe skrzydło',
          color: 'rgba(216, 212, 204, 0.10)',
          polygon: [{ x: 64, y: 38 }, { x: 96, y: 38 }, { x: 96, y: 80 }, { x: 64, y: 80 }]
        },
        {
          id: 'Z_D3',
          playerId: 'D3',
          label: 'D3: lewe skrzydło',
          color: 'rgba(61, 186, 111, 0.12)',
          polygon: [{ x: 4, y: 38 }, { x: 36, y: 38 }, { x: 36, y: 80 }, { x: 4, y: 80 }]
        },
        {
          id: 'D4',
          playerId: 'D4',
          label: 'D4: prawy dół i róg',
          color: 'rgba(255, 90, 110, 0.12)',
          polygon: [{ x: 50, y: 4 }, { x: 96, y: 4 }, { x: 96, y: 38 }, { x: 50, y: 38 }]
        },
        {
          id: 'D5',
          playerId: 'D5',
          label: 'D5: lewy dół i róg',
          color: 'rgba(156, 151, 143, 0.12)',
          polygon: [{ x: 4, y: 4 }, { x: 50, y: 4 }, { x: 50, y: 38 }, { x: 4, y: 38 }]
        }
      ],
      coachingKeys: [
        'Zasada 1: Górna trójka (D1, D2, D3) nie daje rywalowi spokojnie złożyć się do rzutu za 3',
        'Zasada 2: Po podaniu na skrzydło D2 doskakuje, a D1 schodzi na róg pola trzech sekund',
        'Zasada 3: Wysocy z dołu (D4, D5) rotują pod koszem i przejmują rogi boiska',
        'Zasada 4: Wszyscy wracają pod kosz walczyć o zbiórkę'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 2.0,
          title: 'Krok 1: Mur na łuku – piłka u O3 na lewym skrzydle',
          description: 'O3 z piłką: D3 doskakuje z ręką w górze, D1 pilnuje lewego rogu pola trzech sekund, D2 pilnuje środka, D5 pilnuje strefy pod koszem.',
          coachingCues: ['Wysoko ręce na obwodzie', 'Górna trójka blisko siebie']
        },
        {
          startTime: 2.0,
          endTime: 4.2,
          title: 'Krok 2: Przerzut piłki przez szczyt (O1) na prawe skrzydło (O2)',
          description: 'O3 odgrywa do O1, a O1 od razu podaje do O2. D1 doskakuje na szczycie, a po podaniu D2 sprintem doskakuje do O2.',
          coachingCues: ['Szybkie przesunięcie górnej trójki', 'Nie zostawiaj miejsca na rzut']
        },
        {
          startTime: 4.2,
          endTime: 6.2,
          title: 'Krok 3: Wymuszony rzut za 3 i blok D2',
          description: 'O2 próbuje rzucać przez ręce. D2 wyskakuje pionowo i blokuje rzut czubkami palców.',
          coachingCues: ['Wyskok pionowy, bez faulu', 'Czysty blok']
        },
        {
          startTime: 6.2,
          endTime: 8.5,
          title: 'Krok 4: Zbiórka D4 i D5',
          description: 'Zablokowana piłka spada w pole trzech sekund – D4 i D5 odcinają rywali od kosza i pewnie zbierają piłkę.',
          coachingCues: ['Pewny chwyt oburącz', 'Zbiórka w obronie']
        }
      ],
      players: [
        // Atak
        {
          id: 'O1',
          number: 1,
          name: '1 (rozgrywający)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 82, heading: 270, action: 'idle' },
            { time: 2.2, x: 50, y: 82, heading: 270, action: 'catch' },
            { time: 3.8, x: 50, y: 82, heading: 90, action: 'idle' },
            { time: 8.5, x: 50, y: 80, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 2,
          name: '2 (rzucający obrońca)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 80, y: 64, heading: 270, action: 'idle' },
            { time: 4.5, x: 82, y: 62, heading: 270, action: 'catch' },
            { time: 6.2, x: 82, y: 62, heading: 0, action: 'shoot' },
            { time: 8.5, x: 82, y: 62, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 3,
          name: '3 (niski skrzydłowy)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 20, y: 64, heading: 90, action: 'dribble' },
            { time: 1.6, x: 20, y: 64, heading: 90, action: 'idle' },
            { time: 8.5, x: 18, y: 62, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 4,
          name: '4 (silny skrzydłowy)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 84, y: 22, heading: 0, action: 'idle' },
            { time: 8.5, x: 74, y: 16, heading: 0, action: 'cut' }
          ]
        },
        {
          id: 'O5',
          number: 5,
          name: '5 (środkowy)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 16, y: 22, heading: 0, action: 'idle' },
            { time: 8.5, x: 26, y: 16, heading: 0, action: 'cut' }
          ]
        },
        // Obrońcy
        {
          id: 'D1',
          number: 1,
          name: 'D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 38, y: 68, heading: 240, action: 'defend' },
            { time: 2.2, x: 50, y: 75, heading: 180, action: 'defend' },
            { time: 4.5, x: 62, y: 70, heading: 120, action: 'defend' },
            { time: 8.5, x: 56, y: 68, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 62, y: 56, heading: 240, action: 'defend' },
            { time: 2.2, x: 72, y: 66, heading: 180, action: 'defend' },
            { time: 4.5, x: 76, y: 60, heading: 90, action: 'defend' },
            { time: 6.4, x: 78, y: 60, heading: 90, action: 'defend' },
            { time: 8.5, x: 76, y: 58, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 22, y: 60, heading: 270, action: 'defend' },
            { time: 2.2, x: 28, y: 66, heading: 180, action: 'defend' },
            { time: 4.5, x: 38, y: 58, heading: 140, action: 'defend' },
            { time: 8.5, x: 36, y: 50, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 58, y: 22, heading: 270, action: 'defend' },
            { time: 4.5, x: 68, y: 24, heading: 90, action: 'defend' },
            { time: 7.0, x: 58, y: 20, heading: 0, action: 'defend' },
            { time: 8.5, x: 54, y: 16, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 30, y: 24, heading: 270, action: 'defend' },
            { time: 2.2, x: 36, y: 26, heading: 180, action: 'defend' },
            { time: 4.5, x: 46, y: 20, heading: 90, action: 'defend' },
            { time: 8.5, x: 46, y: 16, heading: 0, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 20, y: 64, holderId: 'O3' },
          { time: 1.6, x: 20, y: 64, holderId: 'O3' },
          { time: 2.2, x: 50, y: 82, holderId: 'O1', isPass: true, arcHeight: 0.2 },
          { time: 3.8, x: 50, y: 82, holderId: 'O1' },
          { time: 4.5, x: 82, y: 62, holderId: 'O2', isPass: true, arcHeight: 0.25 },
          { time: 6.2, x: 82, y: 62, holderId: 'O2' },
          { time: 6.4, x: 78, y: 60, holderId: null, isShot: true, arcHeight: 0.2 },
          { time: 7.4, x: 58, y: 22, holderId: null, isPass: true, arcHeight: 0.4 },
          { time: 8.5, x: 54, y: 16, holderId: 'D4' }
        ]
      }
    }
  }
];
