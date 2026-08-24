/**
 * Biblioteka Gotowych Presetów Animowanych Zagrywek Koszykarskich (BeKaPaKa Stats)
 * Format oparty o ciągłą oś czasu (Continuous Keyframes Timeline 0.0s - 6.0s)
 */

export const DEFAULT_PLAYBOOK_PRESETS = [
  {
    name: 'Horns Flare vs Strefa 2-3',
    category: 'half_court',
    targetDefense: 'Strefa 2-3',
    description: 'Klasyczne ustawienie Rogów (Horns) rozbijające pierwszą linię obrony strefowej. Zasłona flare na szczycie uwalnia strzelca w rogu boiska na czysty rzut za 3.',
    tags: ['Horns', 'Strefa 2-3', 'Corner 3', 'Rzut za 3'],
    diagramData: {
      duration: 5.5,
      coachingKeys: [
        'Zasłona na szczycie musi zablokować powrót górnego obrońcy strefy',
        'Podanie typu skip pass musi być posłane silnie i bezpośrednio do rąk',
        'Skrzydłowy w rogu musi być gotowy do natychmiastowego rzutu (Catch & Shoot)',
        'Center po zasłonie natychmiast roluje pod kosz na zbiórkę ofensywną'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.8,
          title: 'Faza 1: Rozegranie Horns & Zaangażowanie Strefy',
          description: 'Rozgrywający (1) wprowadza piłkę koźłem na prawe skrzydło, zmuszając górnego obrońcę strefy (D2) do podejścia.',
          coachingCues: ['Szeroki spacing', 'Kozioł z głową w górze']
        },
        {
          startTime: 1.8,
          endTime: 3.6,
          title: 'Faza 2: Zasłona Flare & Ścięcie w Róg',
          description: 'Center (5) stawia twardą zasłonę w plecy obrońcy (D2). Skrzydłowy (3) ścina po łuku w prawy róg boiska.',
          coachingCues: ['Kontakt bark w bark', 'Sprint po łuku do rogu']
        },
        {
          startTime: 3.6,
          endTime: 5.5,
          title: 'Faza 3: Laserowy Skip Pass & Czysty Rzut za 3',
          description: 'Rozgrywający posyła silne podanie skip pass do rogu. (3) łapie piłkę w wyskoku i trafia za 3 punkty.',
          coachingCues: ['Catch & Shoot w tempie', 'Center na desce']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 10,
          name: 'Rozgrywający (PG)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 82, heading: 180, action: 'idle' },
            { time: 1.5, x: 68, y: 72, heading: 140, action: 'dribble' },
            { time: 3.6, x: 68, y: 72, heading: 110, action: 'idle' },
            { time: 4.2, x: 66, y: 74, heading: 110, action: 'idle' },
            { time: 5.5, x: 64, y: 76, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 7,
          name: 'Rzucający Obrońca (SG)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 18, y: 65, heading: 180, action: 'idle' },
            { time: 2.0, x: 22, y: 75, heading: 90, action: 'idle' },
            { time: 5.5, x: 25, y: 78, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 24,
          name: 'Niski Skrzydłowy (SF)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 82, y: 65, heading: 180, action: 'idle' },
            { time: 1.8, x: 78, y: 60, heading: 220, action: 'cut' },
            { time: 3.6, x: 90, y: 22, heading: 270, action: 'catch' },
            { time: 4.2, x: 90, y: 22, heading: 270, action: 'shoot' },
            { time: 5.5, x: 90, y: 22, heading: 270, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 15,
          name: 'Silny Skrzydłowy (PF)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 35, y: 40, heading: 180, action: 'idle' },
            { time: 2.5, x: 42, y: 35, heading: 90, action: 'idle' },
            { time: 5.5, x: 45, y: 25, heading: 0, action: 'roll' }
          ]
        },
        {
          id: 'O5',
          number: 33,
          name: 'Środkowy (C)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 65, y: 40, heading: 180, action: 'idle' },
            { time: 1.8, x: 75, y: 58, heading: 180, action: 'set_screen' },
            { time: 3.6, x: 75, y: 58, heading: 180, action: 'set_screen' },
            { time: 4.5, x: 55, y: 22, heading: 0, action: 'roll' },
            { time: 5.5, x: 50, y: 18, heading: 0, action: 'idle' }
          ]
        },
        // Obrońcy strefy 2-3
        {
          id: 'D1',
          number: 1,
          name: 'Obrońca D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 42, y: 70, heading: 0, action: 'defend' },
            { time: 2.0, x: 52, y: 68, heading: 90, action: 'defend' },
            { time: 5.5, x: 55, y: 65, heading: 90, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'Obrońca D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 58, y: 70, heading: 0, action: 'defend' },
            { time: 1.8, x: 66, y: 65, heading: 90, action: 'defend' },
            { time: 3.6, x: 72, y: 56, heading: 90, action: 'defend' },
            { time: 5.5, x: 74, y: 50, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'Obrońca D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 22, y: 40, heading: 0, action: 'defend' },
            { time: 5.5, x: 28, y: 32, heading: 90, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'Obrońca D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 50, y: 30, heading: 0, action: 'defend' },
            { time: 3.5, x: 52, y: 26, heading: 90, action: 'defend' },
            { time: 5.5, x: 50, y: 20, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'Obrońca D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 78, y: 40, heading: 0, action: 'defend' },
            { time: 3.6, x: 74, y: 32, heading: 0, action: 'defend' },
            { time: 5.5, x: 84, y: 24, heading: 90, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 50, y: 82, holderId: 'O1' },
          { time: 1.5, x: 68, y: 72, holderId: 'O1' },
          { time: 3.6, x: 68, y: 72, holderId: 'O1' },
          { time: 4.1, x: 90, y: 22, holderId: 'O3', isPass: true, arcHeight: 0.2 },
          { time: 4.5, x: 90, y: 22, holderId: 'O3' },
          { time: 5.5, x: 50, y: 14, holderId: null, isShot: true, arcHeight: 1.2 }
        ]
      }
    }
  },
  {
    name: 'Spain Pick & Roll (Zasłona z pleców)',
    category: 'half_court',
    targetDefense: 'Obrona każdy swego (Drop / Switch)',
    description: 'Najskuteczniejsza zagrywka współczesnego basketu: klasyczny Pick & Roll uzupełniony o tylną zasłonę (backscreen) dla obrońcy środkowego, otwierający wsad lub rzut za 3.',
    tags: ['Spain PnR', 'Pick & Roll', 'Backscreen', 'EuroLeague'],
    diagramData: {
      duration: 5.2,
      coachingKeys: [
        'Zasłona z pleców musi być precyzyjnie wklejona w obrońcę podkoszowego',
        'Strzelec po postawieniu zasłony natychmiast ucieka na szczyt (Pop na 3PT)',
        'Rozgrywający czyta pierwszą pomoc obrony i decyduje: wsad czy trójka'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.6,
          title: 'Faza 1: Inicjacja PnR na Szczycie',
          description: 'Center (5) stawia zasłonę na piłce. Rozgrywający (1) atakuje w lewo w stronę łuku rzutów wolnych.',
          coachingCues: ['Niski kozioł', 'Agresywny wjazd w głąb']
        },
        {
          startTime: 1.6,
          endTime: 3.4,
          title: 'Faza 2: Hiszpańska Zasłona z Pleców (Backscreen)',
          description: 'Gdy (5) roluje pod kosz, strzelec (3) wkleja zasłonę w plecy goniącego obrońcy (D5).',
          coachingCues: ['Twardy kontakt z plecami', 'Otwarcie drogi pod kosz']
        },
        {
          startTime: 3.4,
          endTime: 5.2,
          title: 'Faza 3: Podanie Lobem i Wsad / Pop na Trójkę',
          description: 'Rozgrywający posyła lob prosto nad obręcz do niekrytego (5) na efektowny wsad.',
          coachingCues: ['Precyzyjny lob', 'Pewne wykończenie w powietrzu']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 10,
          name: 'Rozgrywający (PG)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 82, heading: 180, action: 'idle' },
            { time: 1.6, x: 38, y: 65, heading: 140, action: 'dribble' },
            { time: 3.4, x: 38, y: 60, heading: 90, action: 'idle' },
            { time: 5.2, x: 36, y: 62, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 7,
          name: 'Rzucający Obrońca (SG)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 18, y: 70, heading: 180, action: 'idle' },
            { time: 5.2, x: 15, y: 68, heading: 90, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 24,
          name: 'Niski Skrzydłowy (SF)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 55, heading: 180, action: 'idle' },
            { time: 2.2, x: 48, y: 48, heading: 0, action: 'set_screen' },
            { time: 3.8, x: 58, y: 78, heading: 0, action: 'pop' },
            { time: 5.2, x: 58, y: 78, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 15,
          name: 'Silny Skrzydłowy (PF)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 85, y: 30, heading: 180, action: 'idle' },
            { time: 5.2, x: 88, y: 22, heading: 270, action: 'idle' }
          ]
        },
        {
          id: 'O5',
          number: 33,
          name: 'Środkowy (C)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 60, y: 75, heading: 180, action: 'idle' },
            { time: 1.4, x: 48, y: 72, heading: 270, action: 'set_screen' },
            { time: 3.4, x: 50, y: 22, heading: 0, action: 'roll' },
            { time: 4.2, x: 50, y: 15, heading: 0, action: 'catch' },
            { time: 5.2, x: 50, y: 14, heading: 0, action: 'shoot' }
          ]
        },
        // Obrońcy
        {
          id: 'D1',
          number: 1,
          name: 'Obrońca D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 50, y: 76, heading: 0, action: 'defend' },
            { time: 1.6, x: 42, y: 70, heading: 270, action: 'defend' },
            { time: 5.2, x: 40, y: 64, heading: 270, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'Obrońca D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 22, y: 65, heading: 0, action: 'defend' },
            { time: 5.2, x: 19, y: 62, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'Obrońca D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 52, y: 50, heading: 0, action: 'defend' },
            { time: 2.2, x: 52, y: 44, heading: 0, action: 'defend' },
            { time: 5.2, x: 56, y: 70, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'Obrońca D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 80, y: 30, heading: 0, action: 'defend' },
            { time: 5.2, x: 82, y: 25, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'Obrońca D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 58, y: 70, heading: 0, action: 'defend' },
            { time: 1.6, x: 45, y: 58, heading: 0, action: 'defend' },
            { time: 3.4, x: 48, y: 44, heading: 0, action: 'defend' },
            { time: 5.2, x: 48, y: 26, heading: 0, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 50, y: 82, holderId: 'O1' },
          { time: 1.6, x: 38, y: 65, holderId: 'O1' },
          { time: 3.4, x: 38, y: 60, holderId: 'O1' },
          { time: 4.2, x: 50, y: 15, holderId: 'O5', isPass: true, arcHeight: 0.8 },
          { time: 5.2, x: 50, y: 14, holderId: null, isShot: true, arcHeight: 0.2 }
        ]
      }
    }
  },
  {
    name: 'Box Cross BLOB (Aut spod kosza)',
    category: 'blob',
    targetDefense: 'Obrona każdy swego (Man-to-Man)',
    description: 'Zagrywka ze stałego fragmentu gry zza linii końcowej w formacji Box. Podwójna zasłona krzyżowa wysokich uwalnia centra wprost pod samą obręcz na natychmiastowy layup.',
    tags: ['BLOB', 'Box Set', 'Layup', 'Punkty z pomalowanego'],
    diagramData: {
      duration: 4.5,
      coachingKeys: [
        'Zasłona na linii końcowej musi być postawiona legalnie z mocnym kontaktem',
        'Podający czeka dokładnie do momentu minięcia zasłony przez centra',
        'Gracz (2) na obwodzie stanowi opcję awaryjną (Safety Valve)'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Rozstawienie Box & Sygnał Podającego',
          description: 'Ustawienie w kwadrat (Box). Podający (1) klaszcze w dłonie dając sygnał do rozpoczęcia ruchu.',
          coachingCues: ['Perfekcyjny timing', 'Gotowość do zasłon']
        },
        {
          startTime: 1.5,
          endTime: 3.2,
          title: 'Faza 2: Podwójna Zasłona Krzyżowa (Cross Screen)',
          description: '(4) stawia zasłonę wzdłuż linii końcowej dla (5). (3) stawia zasłonę na obwód dla strzelca (2).',
          coachingCues: ['Bark w bark', 'Sprint pod kosz']
        },
        {
          startTime: 3.2,
          endTime: 4.5,
          title: 'Faza 3: Dogranie Pod Kosz i Łatwe Punkty',
          description: '(1) posyła precyzyjne podanie kozłem do wolnego (5) pod samą obręcz na 2 punkty.',
          coachingCues: ['Pewny chwyt', 'Szybki layup']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 10,
          name: 'Wprowadzający (PG)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 4, heading: 0, action: 'idle' },
            { time: 4.5, x: 50, y: 4, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 7,
          name: 'Rzucający Obrońca (SG)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 35, y: 35, heading: 0, action: 'idle' },
            { time: 3.0, x: 75, y: 65, heading: 90, action: 'cut' },
            { time: 4.5, x: 75, y: 65, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 24,
          name: 'Niski Skrzydłowy (SF)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 65, y: 35, heading: 0, action: 'idle' },
            { time: 2.0, x: 50, y: 35, heading: 270, action: 'set_screen' },
            { time: 4.5, x: 50, y: 35, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 15,
          name: 'Silny Skrzydłowy (PF)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 35, y: 18, heading: 0, action: 'idle' },
            { time: 2.0, x: 50, y: 18, heading: 90, action: 'set_screen' },
            { time: 4.5, x: 50, y: 18, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O5',
          number: 33,
          name: 'Środkowy (C)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 65, y: 18, heading: 0, action: 'idle' },
            { time: 1.8, x: 38, y: 14, heading: 270, action: 'cut' },
            { time: 3.4, x: 46, y: 13, heading: 0, action: 'catch' },
            { time: 4.5, x: 48, y: 14, heading: 0, action: 'shoot' }
          ]
        },
        // Obrońcy
        {
          id: 'D1',
          number: 1,
          name: 'Obrońca D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 50, y: 10, heading: 180, action: 'defend' },
            { time: 4.5, x: 50, y: 10, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'Obrońca D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 35, y: 30, heading: 180, action: 'defend' },
            { time: 3.0, x: 70, y: 55, heading: 90, action: 'defend' },
            { time: 4.5, x: 70, y: 55, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'Obrońca D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 65, y: 30, heading: 180, action: 'defend' },
            { time: 4.5, x: 52, y: 30, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'Obrońca D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 35, y: 14, heading: 180, action: 'defend' },
            { time: 4.5, x: 48, y: 14, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'Obrońca D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 65, y: 14, heading: 180, action: 'defend' },
            { time: 2.2, x: 58, y: 16, heading: 270, action: 'defend' },
            { time: 4.5, x: 54, y: 15, heading: 180, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 50, y: 4, holderId: 'O1' },
          { time: 2.5, x: 50, y: 4, holderId: 'O1' },
          { time: 3.4, x: 46, y: 13, holderId: 'O5', isPass: true, arcHeight: 0.1 },
          { time: 4.5, x: 50, y: 14, holderId: null, isShot: true, arcHeight: 0.2 }
        ]
      }
    }
  },
  {
    name: 'SLOB Hammer (Aut boczny ze ścięciem)',
    category: 'slob',
    targetDefense: 'Obrona każdy swego (Man-to-Man)',
    description: 'Zagrywka z autu bocznego. Dynamiczny wjazd na kosz z prawej strony zmusza obronę do rotacji, a zasłona Hammer na słabej stronie uwalnia strzelca na czystą trójkę w rogu.',
    tags: ['SLOB', 'Hammer Action', 'Spurs System', 'Corner 3'],
    diagramData: {
      duration: 5.0,
      coachingKeys: [
        'Wjazd musi być agresywny, by wymusić rotację obrony spod kosza',
        'Zasłona Hammer musi odciąć obrońcę w rogu boiska',
        'Podanie z linii końcowej wymaga precyzji i siły'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Wprowadzenie Piłki & Wjazd w Głąb',
          description: '(1) wprowadza piłkę do (2), który natychmiast atakuje wzdłuż linii końcowej w stronę kosza.',
          coachingCues: ['Szybki pierwszy krok', 'Ściągnięcie pomocy']
        },
        {
          startTime: 1.5,
          endTime: 3.5,
          title: 'Faza 2: Zasłona Hammer na Słabej Stronie',
          description: '(4) stawia zasłonę Hammer w lewym rogu dla (3). Obrońca (D3) zostaje całkowicie odcięty.',
          coachingCues: ['Kąt zasłony tyłem do kosza', 'Bieg w narożnik']
        },
        {
          startTime: 3.5,
          endTime: 5.0,
          title: 'Faza 3: Podanie wzdłuż Linii Końcowej i Trójka',
          description: '(2) posyła podanie typu baseline drift pass do rogu. (3) oddaje niekryty rzut za 3.',
          coachingCues: ['Precyzyjne podanie', 'Czysty rzut ze skrzydła']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 10,
          name: 'Wprowadzający (PG)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 96, y: 60, heading: 270, action: 'idle' },
            { time: 1.5, x: 80, y: 75, heading: 180, action: 'idle' },
            { time: 5.0, x: 80, y: 75, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 7,
          name: 'Wjeżdżający (SG)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 75, y: 70, heading: 90, action: 'idle' },
            { time: 1.2, x: 75, y: 70, heading: 180, action: 'catch' },
            { time: 3.4, x: 78, y: 20, heading: 180, action: 'dribble' },
            { time: 5.0, x: 78, y: 20, heading: 270, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 24,
          name: 'Strzelec w Rogu (SF)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 25, y: 70, heading: 180, action: 'idle' },
            { time: 3.2, x: 10, y: 18, heading: 270, action: 'cut' },
            { time: 4.0, x: 10, y: 18, heading: 90, action: 'catch' },
            { time: 5.0, x: 10, y: 18, heading: 90, action: 'shoot' }
          ]
        },
        {
          id: 'O4',
          number: 15,
          name: 'Zasłaniający Hammer (PF)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 30, y: 35, heading: 180, action: 'idle' },
            { time: 2.0, x: 18, y: 30, heading: 270, action: 'set_screen' },
            { time: 5.0, x: 18, y: 30, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O5',
          number: 33,
          name: 'Środkowy (C)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 60, y: 40, heading: 180, action: 'idle' },
            { time: 3.0, x: 50, y: 30, heading: 0, action: 'idle' },
            { time: 5.0, x: 50, y: 22, heading: 0, action: 'roll' }
          ]
        },
        // Obrońcy
        {
          id: 'D1',
          number: 1,
          name: 'Obrońca D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 90, y: 60, heading: 90, action: 'defend' },
            { time: 5.0, x: 80, y: 70, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'Obrońca D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 70, y: 65, heading: 0, action: 'defend' },
            { time: 3.4, x: 75, y: 25, heading: 180, action: 'defend' },
            { time: 5.0, x: 75, y: 25, heading: 270, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'Obrońca D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 25, y: 60, heading: 0, action: 'defend' },
            { time: 2.2, x: 22, y: 34, heading: 180, action: 'defend' },
            { time: 5.0, x: 20, y: 28, heading: 270, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'Obrońca D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 30, y: 30, heading: 0, action: 'defend' },
            { time: 5.0, x: 25, y: 28, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'Obrońca D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 60, y: 35, heading: 0, action: 'defend' },
            { time: 3.0, x: 55, y: 28, heading: 0, action: 'defend' },
            { time: 5.0, x: 55, y: 22, heading: 0, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 96, y: 60, holderId: 'O1' },
          { time: 1.0, x: 75, y: 70, holderId: 'O2', isPass: true, arcHeight: 0.2 },
          { time: 3.4, x: 78, y: 20, holderId: 'O2' },
          { time: 4.0, x: 10, y: 18, holderId: 'O3', isPass: true, arcHeight: 0.3 },
          { time: 5.0, x: 50, y: 14, holderId: null, isShot: true, arcHeight: 1.1 }
        ]
      }
    }
  },
  {
    name: 'Elevator Doors ATO (Zasłona Windowa)',
    category: 'ato',
    targetDefense: 'Obrona każdy swego (Po czasie / Clutch)',
    description: 'Zagrywka po przerwie na żądanie (After Time Out). Strzelec wykonuje sprint między dwoma wysokimi, którzy zatrzaskują za nim drzwi (Elevator Screen), zostawiając obrońcę w tyle.',
    tags: ['ATO', 'Elevator Screen', 'Clutch', 'Warriors Action'],
    diagramData: {
      duration: 4.8,
      coachingKeys: [
        'Zasłaniający muszą zamknąć przestrzeń w ułamku sekundy po przebiegnięciu strzelca',
        'Podanie musi być natychmiastowe (Catch & Shoot bez kozła)',
        'Timing jest kluczem — bieg nie może zacząć się za wcześnie'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Rozegranie na Skrzydle & Sprint Strzelca',
          description: '(1) kontroluje piłkę na lewym skrzydle. Strzelec (2) zrywa się spod kosza wprost w stronę szczytu.',
          coachingCues: ['Eksplozywny start', 'Wysocy gotowi do zamknięcia']
        },
        {
          startTime: 1.5,
          endTime: 3.2,
          title: 'Faza 2: Zamknięcie Drzwi Windy (Elevator Doors)',
          description: '(2) przebiega między (4) i (5), po czym wysocy zwierają ramiona. Obrońca (D2) uderza w podwójny blok.',
          coachingCues: ['Zwarte ramiona', 'Czyste odcięcie obrońcy']
        },
        {
          startTime: 3.2,
          endTime: 4.8,
          title: 'Faza 3: Podanie na Szczyt i Rzut za 3',
          description: '(1) posyła podanie prosto na klatkę piersiową (2). Błyskawiczny rzut za 3 punkty.',
          coachingCues: ['Catch & Shoot w tempie', 'Pewne trafienie']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 10,
          name: 'Podający (PG)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 25, y: 75, heading: 90, action: 'idle' },
            { time: 4.8, x: 25, y: 75, heading: 90, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 7,
          name: 'Strzelec Windy (SG)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 20, heading: 0, action: 'idle' },
            { time: 2.2, x: 50, y: 76, heading: 0, action: 'cut' },
            { time: 3.5, x: 50, y: 78, heading: 270, action: 'catch' },
            { time: 4.8, x: 50, y: 78, heading: 0, action: 'shoot' }
          ]
        },
        {
          id: 'O3',
          number: 24,
          name: 'Skrzydłowy (SF)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 80, y: 70, heading: 270, action: 'idle' },
            { time: 4.8, x: 85, y: 65, heading: 270, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 15,
          name: 'Wysoki Lewy (PF)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 42, y: 60, heading: 0, action: 'idle' },
            { time: 2.2, x: 47, y: 65, heading: 90, action: 'set_screen' },
            { time: 4.8, x: 47, y: 65, heading: 90, action: 'set_screen' }
          ]
        },
        {
          id: 'O5',
          number: 33,
          name: 'Wysoki Prawy (C)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 58, y: 60, heading: 0, action: 'idle' },
            { time: 2.2, x: 53, y: 65, heading: 270, action: 'set_screen' },
            { time: 4.8, x: 53, y: 65, heading: 270, action: 'set_screen' }
          ]
        },
        // Obrońcy
        {
          id: 'D1',
          number: 1,
          name: 'Obrońca D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 28, y: 70, heading: 270, action: 'defend' },
            { time: 4.8, x: 28, y: 70, heading: 270, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'Obrońca D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 50, y: 26, heading: 0, action: 'defend' },
            { time: 2.2, x: 50, y: 56, heading: 0, action: 'defend' },
            { time: 4.8, x: 50, y: 58, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'Obrońca D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 78, y: 65, heading: 90, action: 'defend' },
            { time: 4.8, x: 80, y: 60, heading: 90, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'Obrońca D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 42, y: 55, heading: 0, action: 'defend' },
            { time: 4.8, x: 42, y: 60, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'Obrońca D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 58, y: 55, heading: 0, action: 'defend' },
            { time: 4.8, x: 58, y: 60, heading: 0, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 25, y: 75, holderId: 'O1' },
          { time: 2.8, x: 25, y: 75, holderId: 'O1' },
          { time: 3.5, x: 50, y: 78, holderId: 'O2', isPass: true, arcHeight: 0.2 },
          { time: 4.8, x: 50, y: 14, holderId: null, isShot: true, arcHeight: 1.3 }
        ]
      }
    }
  }
];
