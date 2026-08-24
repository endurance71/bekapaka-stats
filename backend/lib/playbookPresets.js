/**
 * Biblioteka Gotowych Presetów Animowanych Zagrywek Koszykarskich (BeKaPaKa Stats)
 * Format oparty o pełny cykl życia akcji (8.5s) z oficjalnymi symbolami zasłon (T-Bar)
 */

export const DEFAULT_PLAYBOOK_PRESETS = [
  {
    name: 'Horns Flare vs Strefa 2-3',
    category: 'half_court',
    targetDefense: 'Strefa 2-3',
    description: 'Klasyczne ustawienie Rogów (Horns) rozbijające pierwszą linię strefy. Zasłona flare na szczycie uwalnia strzelca w rogu boiska na czysty rzut za 3.',
    tags: ['Horns', 'Strefa 2-3', 'Corner 3', 'Rzut za 3'],
    diagramData: {
      duration: 8.5,
      coachingKeys: [
        'Ustawienie wyjściowe Horns zmusza obronę do rozciągnięcia linii',
        'Zasłona na szczycie (T-Bar) musi zablokować powrót górnego obrońcy strefy',
        'Podanie typu skip pass musi być posłane silnie wprost do rąk',
        'Center po zasłonie natychmiast roluje pod kosz na zbiórkę ofensywną'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie Wyjściowe Formacji Horns',
          description: 'Zespół w formacji Rogów: PG na szczycie, SG i SF w skrzydłach, PF i C na łokciach trumny. Obrona strefowa 2-3 zajmuje pozycje.',
          coachingCues: ['Szeroki spacing', 'Cierpliwe rozpoznanie obrony']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Zasłona Flare (T-Bar) & Ścięcie w Róg',
          description: 'Center (C) stawia twardą zasłonę (T-Bar) w plecy obrońcy strefy (D2). Skrzydłowy (SF) wykonuje zwód i ścina po łuku w róg.',
          coachingCues: ['Kontakt bark w bark', 'Sprint po łuku do rogu']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Laserowy Skip Pass do Rogu',
          description: 'Rozgrywający (PG) posyła bezpośrednie podanie przez całe boisko do wybiegającego w narożnik (SF).',
          coachingCues: ['Podanie prosto w klatkę', 'Gotowość do chwytu w wyskoku']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Czysty Rzut za 3, Trafienie i Zbiórka',
          description: 'Skrzydłowy oddaje czysty rzut za 3 punkty. Piłka wpada do kosza, a Center (C) zbiega pod kosz na zbiórkę.',
          coachingCues: ['Catch & Shoot w tempie', 'Center zabezpiecza deskę']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 10,
          name: 'Damian',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 82, heading: 180, action: 'idle' },
            { time: 1.5, x: 50, y: 82, heading: 180, action: 'idle' },
            { time: 3.5, x: 68, y: 72, heading: 140, action: 'dribble' },
            { time: 5.5, x: 68, y: 72, heading: 110, action: 'idle' },
            { time: 8.5, x: 64, y: 76, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 7,
          name: 'Kaszub',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 18, y: 65, heading: 180, action: 'idle' },
            { time: 1.5, x: 18, y: 65, heading: 180, action: 'idle' },
            { time: 4.5, x: 22, y: 75, heading: 90, action: 'idle' },
            { time: 8.5, x: 25, y: 78, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 24,
          name: 'Jędrzej',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 82, y: 65, heading: 180, action: 'idle' },
            { time: 1.5, x: 82, y: 65, heading: 180, action: 'idle' },
            { time: 3.5, x: 78, y: 60, heading: 220, action: 'cut' },
            { time: 5.5, x: 90, y: 22, heading: 270, action: 'catch' },
            { time: 6.8, x: 90, y: 22, heading: 270, action: 'shoot' },
            { time: 8.5, x: 90, y: 22, heading: 270, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 15,
          name: 'Maciej',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 35, y: 40, heading: 180, action: 'idle' },
            { time: 1.5, x: 35, y: 40, heading: 180, action: 'idle' },
            { time: 4.5, x: 42, y: 35, heading: 90, action: 'idle' },
            { time: 8.5, x: 45, y: 25, heading: 0, action: 'roll' }
          ]
        },
        {
          id: 'O5',
          number: 33,
          name: 'Filip',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 65, y: 40, heading: 180, action: 'idle' },
            { time: 1.5, x: 65, y: 40, heading: 180, action: 'idle' },
            { time: 3.5, x: 75, y: 58, heading: 180, action: 'set_screen' },
            { time: 5.5, x: 75, y: 58, heading: 180, action: 'set_screen' },
            { time: 7.0, x: 55, y: 22, heading: 0, action: 'roll' },
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
            { time: 0.0, x: 42, y: 70, heading: 0, action: 'defend' },
            { time: 1.5, x: 42, y: 70, heading: 0, action: 'defend' },
            { time: 4.0, x: 52, y: 68, heading: 90, action: 'defend' },
            { time: 8.5, x: 55, y: 65, heading: 90, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 58, y: 70, heading: 0, action: 'defend' },
            { time: 1.5, x: 58, y: 70, heading: 0, action: 'defend' },
            { time: 3.5, x: 66, y: 65, heading: 90, action: 'defend' },
            { time: 5.5, x: 72, y: 56, heading: 90, action: 'defend' },
            { time: 8.5, x: 74, y: 50, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 22, y: 40, heading: 0, action: 'defend' },
            { time: 1.5, x: 22, y: 40, heading: 0, action: 'defend' },
            { time: 8.5, x: 28, y: 32, heading: 90, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 50, y: 30, heading: 0, action: 'defend' },
            { time: 1.5, x: 50, y: 30, heading: 0, action: 'defend' },
            { time: 5.0, x: 52, y: 26, heading: 90, action: 'defend' },
            { time: 8.5, x: 50, y: 20, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 78, y: 40, heading: 0, action: 'defend' },
            { time: 1.5, x: 78, y: 40, heading: 0, action: 'defend' },
            { time: 5.5, x: 74, y: 32, heading: 0, action: 'defend' },
            { time: 8.5, x: 84, y: 24, heading: 90, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 50, y: 82, holderId: 'O1' },
          { time: 1.5, x: 50, y: 82, holderId: 'O1' },
          { time: 3.5, x: 68, y: 72, holderId: 'O1' },
          { time: 5.0, x: 68, y: 72, holderId: 'O1' },
          { time: 5.8, x: 90, y: 22, holderId: 'O3', isPass: true, arcHeight: 0.2 },
          { time: 6.8, x: 90, y: 22, holderId: 'O3' },
          { time: 7.8, x: 50, y: 14, holderId: null, isShot: true, arcHeight: 1.3 },
          { time: 8.5, x: 50, y: 14, holderId: null }
        ]
      }
    }
  },
  {
    name: 'Spain Pick & Roll (Zasłona z pleców)',
    category: 'half_court',
    targetDefense: 'Obrona każdy swego (Drop / Switch)',
    description: 'Klasyczny Pick & Roll uzupełniony o tylną zasłonę (backscreen T-Bar) dla obrońcy środkowego, otwierający wsad lub rzut za 3.',
    tags: ['Spain PnR', 'Pick & Roll', 'Backscreen', 'EuroLeague'],
    diagramData: {
      duration: 8.5,
      coachingKeys: [
        'Zasłona z pleców (T-Bar) musi być precyzyjnie wklejona w obrońcę podkoszowego',
        'Strzelec po zasłonie natychmiast ucieka na szczyt (Pop na 3PT)',
        'Rozgrywający czyta pomoc i decyduje: wsad czy trójka'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie Wyjściowe 5-Out',
          description: 'Szerokie rozstawienie graczy wokół łuku 3PT. Rozgrywający (PG) sygnalizuje zagrywkę Spain.',
          coachingCues: ['Maksymalny spacing', 'Dyscyplina ustawienia']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Zasłona PnR & Hiszpańska Zasłona w Plecy (T-Bar)',
          description: 'Center (C) stawia zasłonę na szczycie. W tym samym czasie (SF) wkleja tylną zasłonę (T-Bar) w obrońcę podkoszowego.',
          coachingCues: ['Mocna belka T-Bar', 'Otwarcie korytarza do obręczy']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Podanie Lobem Nad Obręcz',
          description: 'Rozgrywający posyła wysoki lob prosto w tempo wbiegającego w wolną strefę Centra.',
          coachingCues: ['Miękki lob', 'Chwyt oburącz']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Potężny Wsad i Powrót do Obrony',
          description: 'Center łapie piłkę w powietrzu i pakuje ją z góry do kosza (+2 PTS!).',
          coachingCues: ['Pewne wykończenie', 'Natychmiastowy sprint do obrony']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 10,
          name: 'Damian',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 82, heading: 180, action: 'idle' },
            { time: 1.5, x: 50, y: 82, heading: 180, action: 'idle' },
            { time: 3.5, x: 38, y: 65, heading: 140, action: 'dribble' },
            { time: 5.5, x: 38, y: 60, heading: 90, action: 'idle' },
            { time: 8.5, x: 36, y: 62, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 7,
          name: 'Kaszub',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 18, y: 70, heading: 180, action: 'idle' },
            { time: 1.5, x: 18, y: 70, heading: 180, action: 'idle' },
            { time: 8.5, x: 15, y: 68, heading: 90, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 24,
          name: 'Jędrzej',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 55, heading: 180, action: 'idle' },
            { time: 1.5, x: 50, y: 55, heading: 180, action: 'idle' },
            { time: 3.5, x: 48, y: 48, heading: 0, action: 'set_screen' },
            { time: 5.5, x: 58, y: 78, heading: 0, action: 'pop' },
            { time: 8.5, x: 58, y: 78, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 15,
          name: 'Maciej',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 85, y: 30, heading: 180, action: 'idle' },
            { time: 1.5, x: 85, y: 30, heading: 180, action: 'idle' },
            { time: 8.5, x: 88, y: 22, heading: 270, action: 'idle' }
          ]
        },
        {
          id: 'O5',
          number: 33,
          name: 'Filip',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 60, y: 75, heading: 180, action: 'idle' },
            { time: 1.5, x: 60, y: 75, heading: 180, action: 'idle' },
            { time: 3.0, x: 48, y: 72, heading: 270, action: 'set_screen' },
            { time: 5.5, x: 50, y: 22, heading: 0, action: 'roll' },
            { time: 6.5, x: 50, y: 15, heading: 0, action: 'catch' },
            { time: 8.5, x: 50, y: 14, heading: 0, action: 'shoot' }
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
            { time: 0.0, x: 50, y: 76, heading: 0, action: 'defend' },
            { time: 1.5, x: 50, y: 76, heading: 0, action: 'defend' },
            { time: 3.5, x: 42, y: 70, heading: 270, action: 'defend' },
            { time: 8.5, x: 40, y: 64, heading: 270, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 22, y: 65, heading: 0, action: 'defend' },
            { time: 8.5, x: 19, y: 62, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 52, y: 50, heading: 0, action: 'defend' },
            { time: 3.5, x: 52, y: 44, heading: 0, action: 'defend' },
            { time: 8.5, x: 56, y: 70, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 80, y: 30, heading: 0, action: 'defend' },
            { time: 8.5, x: 82, y: 25, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 58, y: 70, heading: 0, action: 'defend' },
            { time: 3.5, x: 45, y: 58, heading: 0, action: 'defend' },
            { time: 5.5, x: 48, y: 44, heading: 0, action: 'defend' },
            { time: 8.5, x: 48, y: 26, heading: 0, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 50, y: 82, holderId: 'O1' },
          { time: 1.5, x: 50, y: 82, holderId: 'O1' },
          { time: 3.5, x: 38, y: 65, holderId: 'O1' },
          { time: 5.5, x: 38, y: 60, holderId: 'O1' },
          { time: 6.5, x: 50, y: 15, holderId: 'O5', isPass: true, arcHeight: 0.8 },
          { time: 7.5, x: 50, y: 14, holderId: null, isShot: true, arcHeight: 0.2 },
          { time: 8.5, x: 50, y: 14, holderId: null }
        ]
      }
    }
  },
  {
    name: 'Box Cross BLOB (Aut spod kosza)',
    category: 'blob',
    targetDefense: 'Obrona każdy swego (Man-to-Man)',
    description: 'Zagrywka ze stałego fragmentu gry zza linii końcowej w formacji Box. Podwójna zasłona krzyżowa (T-Bar) uwalnia centra wprost pod samą obręcz na natychmiastowy layup.',
    tags: ['BLOB', 'Box Set', 'Layup', 'Punkty z pomalowanego'],
    diagramData: {
      duration: 8.5,
      coachingKeys: [
        'Ustawienie wyjściowe w kwadrat (Box) wymusza błąd krycia obrony',
        'Zasłona na linii końcowej (T-Bar) musi być postawiona z mocnym kontaktem',
        'Podający czeka dokładnie do momentu minięcia zasłony przez centra',
        'Gracz na obwodzie stanowi opcję rezerwową'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie w Kwadrat (Box Formation)',
          description: 'Czterech graczy rozstawia się w kwadrat w trumnie. Podający (PG) zza linii końcowej daje sygnał klaśnięciem.',
          coachingCues: ['Statyczna koncentracja', 'Gotowość do zasłon']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Podwójna Zasłona Krzyżowa (T-Bar)',
          description: '(PF) stawia zasłonę wzdłuż linii dla (C), a (SF) stawia zasłonę na obwód dla (SG). Obrońca (D5) zostaje zablokowany.',
          coachingCues: ['Mocna belka T-Bar', 'Sprint wprost pod kosz']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Podanie Kozłem Pod Sam Kosz',
          description: 'Podający posyła precyzyjne podanie kozłem w tempo do wolnego (C) pod samą obręcz.',
          coachingCues: ['Niskie podanie', 'Pewny chwyt oburącz']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Czysty Layup do Kosza (+2 PTS)',
          description: 'Center bez obrońcy wykańcza akcję łatwym layupem od tablicy do kosza.',
          coachingCues: ['Wysokie wyjście w górę', 'Punkty z pomalowanego']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 10,
          name: 'Damian',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 4, heading: 0, action: 'idle' },
            { time: 8.5, x: 50, y: 4, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 7,
          name: 'Kaszub',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 35, y: 35, heading: 0, action: 'idle' },
            { time: 1.5, x: 35, y: 35, heading: 0, action: 'idle' },
            { time: 4.5, x: 75, y: 65, heading: 90, action: 'cut' },
            { time: 8.5, x: 75, y: 65, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 24,
          name: 'Jędrzej',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 65, y: 35, heading: 0, action: 'idle' },
            { time: 1.5, x: 65, y: 35, heading: 0, action: 'idle' },
            { time: 3.5, x: 50, y: 35, heading: 270, action: 'set_screen' },
            { time: 8.5, x: 50, y: 35, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 15,
          name: 'Maciej',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 35, y: 18, heading: 0, action: 'idle' },
            { time: 1.5, x: 35, y: 18, heading: 0, action: 'idle' },
            { time: 3.5, x: 50, y: 18, heading: 90, action: 'set_screen' },
            { time: 8.5, x: 50, y: 18, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O5',
          number: 33,
          name: 'Filip',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 65, y: 18, heading: 0, action: 'idle' },
            { time: 1.5, x: 65, y: 18, heading: 0, action: 'idle' },
            { time: 3.5, x: 38, y: 14, heading: 270, action: 'cut' },
            { time: 5.5, x: 46, y: 13, heading: 0, action: 'catch' },
            { time: 8.5, x: 48, y: 14, heading: 0, action: 'shoot' }
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
            { time: 0.0, x: 50, y: 10, heading: 180, action: 'defend' },
            { time: 8.5, x: 50, y: 10, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 35, y: 30, heading: 180, action: 'defend' },
            { time: 4.5, x: 70, y: 55, heading: 90, action: 'defend' },
            { time: 8.5, x: 70, y: 55, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 65, y: 30, heading: 180, action: 'defend' },
            { time: 8.5, x: 52, y: 30, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 35, y: 14, heading: 180, action: 'defend' },
            { time: 8.5, x: 48, y: 14, heading: 180, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 65, y: 14, heading: 180, action: 'defend' },
            { time: 3.5, x: 58, y: 16, heading: 270, action: 'defend' },
            { time: 8.5, x: 54, y: 15, heading: 180, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 50, y: 4, holderId: 'O1' },
          { time: 1.5, x: 50, y: 4, holderId: 'O1' },
          { time: 4.5, x: 50, y: 4, holderId: 'O1' },
          { time: 5.5, x: 46, y: 13, holderId: 'O5', isPass: true, arcHeight: 0.1 },
          { time: 7.2, x: 50, y: 14, holderId: null, isShot: true, arcHeight: 0.2 },
          { time: 8.5, x: 50, y: 14, holderId: null }
        ]
      }
    }
  },
  {
    name: 'SLOB Hammer (Aut boczny ze ścięciem)',
    category: 'slob',
    targetDefense: 'Obrona każdy swego (Man-to-Man)',
    description: 'Zagrywka z autu bocznego. Dynamiczny wjazd wzdłuż linii końcowej zmusza obronę do pomocy, a zasłona Hammer (T-Bar) uwalnia strzelca na trójkę w rogu.',
    tags: ['SLOB', 'Hammer Action', 'Spurs System', 'Corner 3'],
    diagramData: {
      duration: 8.5,
      coachingKeys: [
        'Wprowadzenie piłki do wjeżdżającego pod kosz',
        'Zasłona Hammer (T-Bar) musi odciąć obrońcę w rogu boiska',
        'Podanie drift pass wzdłuż linii końcowej wymaga precyzji'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie przy Linii Bocznej',
          description: 'Podający (PG) na aucie bocznym. (SG) przygotowuje się do odbioru piłki na prawym skrzydle.',
          coachingCues: ['Pewny chwyt', 'Mocny pierwszy krok']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Wjazd w Głąb & Zasłona Hammer (T-Bar)',
          description: '(SG) atakuje koźłem wzdłuż linii końcowej. Na słabej stronie (PF) stawia zasłonę Hammer (T-Bar) dla (SF).',
          coachingCues: ['Belka T-Bar tyłem do kosza', 'Sprint do narożnika']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Podanie Baseline Drift Pass',
          description: '(SG) z linii końcowej posyła laserowe podanie ponad obrońcami prosto w lewy narożnik do (SF).',
          coachingCues: ['Podanie w tempo', 'Strzelec gotowy do rzutu']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Czysta Trójka w Rogu i Zbiórka',
          description: 'Skrzydłowy trafia czysty rzut za 3 punkty (+3 PTS!). Wysocy zabezpieczają deskę.',
          coachingCues: ['Catch & Shoot', 'Zbiórka ofensywna']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 10,
          name: 'Damian',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 96, y: 60, heading: 270, action: 'idle' },
            { time: 2.0, x: 80, y: 75, heading: 180, action: 'idle' },
            { time: 8.5, x: 80, y: 75, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 7,
          name: 'Kaszub',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 75, y: 70, heading: 90, action: 'idle' },
            { time: 2.0, x: 75, y: 70, heading: 180, action: 'catch' },
            { time: 5.0, x: 78, y: 20, heading: 180, action: 'dribble' },
            { time: 8.5, x: 78, y: 20, heading: 270, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 24,
          name: 'Jędrzej',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 25, y: 70, heading: 180, action: 'idle' },
            { time: 4.5, x: 10, y: 18, heading: 270, action: 'cut' },
            { time: 6.0, x: 10, y: 18, heading: 90, action: 'catch' },
            { time: 8.5, x: 10, y: 18, heading: 90, action: 'shoot' }
          ]
        },
        {
          id: 'O4',
          number: 15,
          name: 'Maciej',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 30, y: 35, heading: 180, action: 'idle' },
            { time: 3.5, x: 18, y: 30, heading: 270, action: 'set_screen' },
            { time: 8.5, x: 18, y: 30, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O5',
          number: 33,
          name: 'Filip',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 60, y: 40, heading: 180, action: 'idle' },
            { time: 4.5, x: 50, y: 30, heading: 0, action: 'idle' },
            { time: 8.5, x: 50, y: 22, heading: 0, action: 'roll' }
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
            { time: 0.0, x: 90, y: 60, heading: 90, action: 'defend' },
            { time: 8.5, x: 80, y: 70, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 70, y: 65, heading: 0, action: 'defend' },
            { time: 5.0, x: 75, y: 25, heading: 180, action: 'defend' },
            { time: 8.5, x: 75, y: 25, heading: 270, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 25, y: 60, heading: 0, action: 'defend' },
            { time: 3.5, x: 22, y: 34, heading: 180, action: 'defend' },
            { time: 8.5, x: 20, y: 28, heading: 270, action: 'defend' }
          ]
        },
        {
          id: 'D4',
          number: 4,
          name: 'D4',
          role: 'PF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 30, y: 30, heading: 0, action: 'defend' },
            { time: 8.5, x: 25, y: 28, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 60, y: 35, heading: 0, action: 'defend' },
            { time: 4.5, x: 55, y: 28, heading: 0, action: 'defend' },
            { time: 8.5, x: 55, y: 22, heading: 0, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 96, y: 60, holderId: 'O1' },
          { time: 1.5, x: 75, y: 70, holderId: 'O2', isPass: true, arcHeight: 0.2 },
          { time: 5.0, x: 78, y: 20, holderId: 'O2' },
          { time: 6.0, x: 10, y: 18, holderId: 'O3', isPass: true, arcHeight: 0.3 },
          { time: 7.6, x: 50, y: 14, holderId: null, isShot: true, arcHeight: 1.2 },
          { time: 8.5, x: 50, y: 14, holderId: null }
        ]
      }
    }
  },
  {
    name: 'Elevator Doors ATO (Zasłona Windowa)',
    category: 'ato',
    targetDefense: 'Obrona każdy swego (Po czasie / Clutch)',
    description: 'Zagrywka po przerwie na żądanie (After Time Out). Strzelec wykonuje sprint między dwoma wysokimi, którzy zatrzaskują za nim podwójną zasłonę (T-Bar Elevator Doors).',
    tags: ['ATO', 'Elevator Screen', 'Clutch', 'Warriors Action'],
    diagramData: {
      duration: 8.5,
      coachingKeys: [
        'Zasłaniający muszą zamknąć przestrzeń w ułamku sekundy po przebiegnięciu strzelca',
        'Podanie musi być natychmiastowe (Catch & Shoot bez kozła)',
        'Timing sprintu jest kluczowy dla powodzenia akcji'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie Po Przerwie na Żądanie',
          description: '(PG) z piłką na lewym skrzydle. Strzelec (SG) przyczajony pod koszem, wysocy (PF i C) na szczycie.',
          coachingCues: ['Pełna koncentracja', 'Wysocy gotowi do zamknięcia windy']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Sprint Strzelca & Zatzaśnięcie Drzwi Windy (T-Bar)',
          description: '(SG) zrywa się w sprint na szczyt. (PF) i (C) zwierają ramiona tworząc nie do przejścia podwójną belkę zasłony (T-Bar).',
          coachingCues: ['Podwójny T-Bar', 'Obrońca (D2) całkowicie odcięty']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Podanie na Szczyt w Tempo',
          description: '(PG) posyła bezpośrednie podanie na klatkę piersiową (SG) wybiegającego na czystą pozycję na szczycie.',
          coachingCues: ['Silne podanie', 'Złożenie się do rzutu']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Decydujący Rzut za 3 Punkty (+3 PTS)',
          description: '(SG) oddaje rzut za 3 punkty. Piłka wpada czysto do kosza.',
          coachingCues: ['Czysty rzut', 'Celebracja i powrót']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 10,
          name: 'Damian',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 25, y: 75, heading: 90, action: 'idle' },
            { time: 8.5, x: 25, y: 75, heading: 90, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 7,
          name: 'Kaszub',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 20, heading: 0, action: 'idle' },
            { time: 1.5, x: 50, y: 20, heading: 0, action: 'idle' },
            { time: 4.0, x: 50, y: 76, heading: 0, action: 'cut' },
            { time: 5.5, x: 50, y: 78, heading: 270, action: 'catch' },
            { time: 8.5, x: 50, y: 78, heading: 0, action: 'shoot' }
          ]
        },
        {
          id: 'O3',
          number: 24,
          name: 'Jędrzej',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 80, y: 70, heading: 270, action: 'idle' },
            { time: 8.5, x: 85, y: 65, heading: 270, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 15,
          name: 'Maciej',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 42, y: 60, heading: 0, action: 'idle' },
            { time: 3.5, x: 47, y: 65, heading: 90, action: 'set_screen' },
            { time: 8.5, x: 47, y: 65, heading: 90, action: 'set_screen' }
          ]
        },
        {
          id: 'O5',
          number: 33,
          name: 'Filip',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 58, y: 60, heading: 0, action: 'idle' },
            { time: 3.5, x: 53, y: 65, heading: 270, action: 'set_screen' },
            { time: 8.5, x: 53, y: 65, heading: 270, action: 'set_screen' }
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
            { time: 0.0, x: 28, y: 70, heading: 270, action: 'defend' },
            { time: 8.5, x: 28, y: 70, heading: 270, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 50, y: 26, heading: 0, action: 'defend' },
            { time: 4.0, x: 50, y: 56, heading: 0, action: 'defend' },
            { time: 8.5, x: 50, y: 58, heading: 0, action: 'defend' }
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
            { time: 0.0, x: 42, y: 55, heading: 0, action: 'defend' },
            { time: 8.5, x: 42, y: 60, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 58, y: 55, heading: 0, action: 'defend' },
            { time: 8.5, x: 58, y: 60, heading: 0, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 25, y: 75, holderId: 'O1' },
          { time: 4.5, x: 25, y: 75, holderId: 'O1' },
          { time: 5.5, x: 50, y: 78, holderId: 'O2', isPass: true, arcHeight: 0.2 },
          { time: 7.2, x: 50, y: 14, holderId: null, isShot: true, arcHeight: 1.3 },
          { time: 8.5, x: 50, y: 14, holderId: null }
        ]
      }
    }
  }
];
