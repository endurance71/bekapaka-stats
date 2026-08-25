/**
 * Biblioteka Gotowych Presetów Animowanych Zagrywek i Systemów Obronnych Koszykówki (BeKaPaKa Stats)
 * Zawiera schematy ataku pozycyjnego, autów, akcji po czasie (ATO) oraz zaawansowane systemy obrony
 * (1vs1 Man-to-Man z Help & Recover, Strefa 2-3 ze strefami odpowiedzialności, Strefa 3-2 z odcięciem obwodu).
 */

export const DEFAULT_PLAYBOOK_PRESETS = [
  // ==========================================
  // 1. HORNS FLARE VS STREFA 2-3 (ATAK)
  // ==========================================
  {
    name: 'Horns Flare vs Strefa 2-3',
    category: 'half_court',
    targetDefense: 'Strefa 2-3',
    description: 'Klasyczne ustawienie Rogów (Horns) rozbijające pierwszą linię strefy. Zasłona flare 5 (C) na obrońcy D2 uwalnia strzelca 3 (SF) w rogu boiska na czysty rzut za 3.',
    tags: ['Horns', 'Strefa 2-3', 'Corner 3', 'Rzut za 3'],
    diagramData: {
      duration: 8.5,
      outcomeText: '✨ CELNY RZUT ZA 3: POZYCJA 3 (SF) • +3 PKT',
      coachingKeys: [
        'Ustawienie wyjściowe Horns zmusza obronę do rozciągnięcia linii',
        'Zasłona na szczycie (T-Bar) 5 (C) musi zablokować powrót górnego obrońcy strefy D2',
        'Podanie typu skip pass musi być posłane silnie wprost do rąk 3 (SF)',
        'Center 5 (C) po zasłonie natychmiast roluje pod kosz na zbiórkę ofensywną'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie Wyjściowe Formacji Horns',
          description: 'Zespół w formacji Rogów: 1 (PG) na szczycie, 2 (SG) i 3 (SF) w skrzydłach, 4 (PF) i 5 (C) na łokciach trumny. Obrona strefowa 2-3 w gotowości.',
          coachingCues: ['Szeroki spacing', 'Cierpliwe rozpoznanie obrony']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Zasłona Flare (T-Bar) & Ścięcie 3 (SF) w Róg',
          description: '5 (C) podchodzi i stawia twardą zasłonę (T-Bar) w plecy D2. 3 (SF) ociera się bark w bark o 5 (C) i ścina w róg. D2 zostaje zablokowany!',
          coachingCues: ['Kontakt bark w bark', 'Sprint po łuku do rogu']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Laserowy Skip Pass do 3 (SF)',
          description: '1 (PG) posyła bezpośrednie podanie przez całe boisko do wybiegającego w narożnik 3 (SF). Dolny obrońca D5 spóźnia się z doskokiem.',
          coachingCues: ['Podanie prosto w klatkę', 'Gotowość do chwytu w wyskoku']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Czysty Rzut za 3 przez 3 (SF) i Zbiórka 5 (C)',
          description: '3 (SF) oddaje czysty rzut za 3 punkty. Piłka wpada do kosza (+3 PKT), a 5 (C) zbiega pod kosz na zbiórkę.',
          coachingCues: ['Catch & Shoot w tempie', '5 (C) zabezpiecza deskę']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 1,
          name: '1 (PG)',
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
          name: '2 (SG)',
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
          name: '3 (SF)',
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
          name: '4 (PF)',
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
          name: '5 (C)',
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
  // 2. SPAIN PICK & ROLL (ATAK)
  // ==========================================
  {
    name: 'Spain Pick & Roll (Zasłona z pleców)',
    category: 'half_court',
    targetDefense: 'Obrona każdy swego (Drop / Switch)',
    description: 'Klasyczny Pick & Roll uzupełniony o tylną zasłonę 3 (SF) w plecy D5, uwalniający 5 (C) na potężny wsad z góry.',
    tags: ['Spain PnR', 'Pick & Roll', 'Backscreen', 'EuroLeague'],
    diagramData: {
      duration: 8.5,
      outcomeText: '✨ WSAD SPOD KOSZA: POZYCJA 5 (C) • +2 PKT',
      coachingKeys: [
        'Zasłona z pleców (T-Bar) 3 (SF) musi zablokować cofającego się w dropie D5',
        'Strzelec 3 (SF) po zasłonie natychmiast ucieka na szczyt (Pop na 3PT)',
        'Center 5 (C) po minięciu zasłony kończy akcję wsadem nad obręczą'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie Wyjściowe 5-Out',
          description: 'Szerokie rozstawienie graczy wokół łuku 3PT. 1 (PG) na szczycie sygnalizuje zagrywkę Spain.',
          coachingCues: ['Maksymalny spacing', 'Dyscyplina ustawienia']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Zasłona PnR & Hiszpańska Zasłona w Plecy D5 (T-Bar)',
          description: '5 (C) stawia zasłonę na piłce. D5 cofa się w dropie, gdzie 3 (SF) wkleja mu twardy T-Bar w plecy na linii rzutów wolnych. D5 zostaje odcięty!',
          coachingCues: ['Mocna belka T-Bar', 'Otwarcie korytarza do obręczy']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Podanie Lobem Nad Obręcz do 5 (C)',
          description: '1 (PG) posyła wysoki lob prosto w tempo wbiegającego w wolną strefę 5 (C). 3 (SF) ucieka na szczyt (Pop).',
          coachingCues: ['Miękki lob', 'Chwyt oburącz w powietrzu']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Potężny Wsad 5 (C) (+2 PKT) i Powrót do Obrony',
          description: '5 (C) łapie piłkę w powietrzu i pakuje ją z góry do kosza (+2 PKT).',
          coachingCues: ['Pewne wykończenie', 'Natychmiastowy powrót do obrony']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 1,
          name: '1 (PG)',
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
          name: '2 (SG)',
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
          name: '3 (SF)',
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
          name: '4 (PF)',
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
          name: '5 (C)',
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
  // 3. BOX CROSS BLOB (AUT SPOD KOSZA)
  // ==========================================
  {
    name: 'Box Cross BLOB (Aut spod kosza)',
    category: 'blob',
    targetDefense: 'Obrona każdy swego (Man-to-Man)',
    description: 'Zagrywka z autu końcowego w formacji Box. Zasłona 4 (PF) odcina D5, uwalniając 5 (C) pod samą obręcz na łatwy layup.',
    tags: ['BLOB', 'Box Set', 'Layup', 'Punkty z pomalowanego'],
    diagramData: {
      duration: 8.5,
      outcomeText: '✨ LAYUP SPOD KOSZA: POZYCJA 5 (C) • +2 PKT',
      coachingKeys: [
        'Ustawienie wyjściowe w kwadrat (Box) wymusza błąd krycia obrony',
        'Zasłona na linii końcowej (T-Bar) 4 (PF) musi całkowicie zablokować D5',
        'Podający 1 (PG) czeka dokładnie do momentu minięcia zasłony przez 5 (C)',
        'Gracz na obwodzie stanowi opcję rezerwową'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie w Kwadrat (Box Formation)',
          description: 'Czterech graczy rozstawia się w kwadrat w trumnie. Podający 1 (PG) zza linii końcowej daje sygnał.',
          coachingCues: ['Statyczna koncentracja', 'Gotowość do zasłon']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Podwójna Zasłona Krzyżowa (T-Bar) & Ścięcie 5 (C)',
          description: '4 (PF) stawia zasłonę wzdłuż linii dla 5 (C). D5 uderza w zasłonę 4 (PF) i zostaje odcięty, a 5 (C) ścina pod sam kosz.',
          coachingCues: ['Mocna belka T-Bar', 'Sprint wprost pod kosz']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Podanie Kozłem Pod Sam Kosz do 5 (C)',
          description: '1 (PG) posyła precyzyjne podanie kozłem w tempo do wolnego 5 (C) pod samą obręcz.',
          coachingCues: ['Niskie podanie', 'Pewny chwyt oburącz']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Czysty Layup 5 (C) do Kosza (+2 PKT)',
          description: '5 (C) bez obrońcy wykańcza akcję łatwym layupem do kosza (+2 PKT).',
          coachingCues: ['Wysokie wyjście w górę', 'Punkty z pomalowanego']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 1,
          name: '1 (PG)',
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
          name: '2 (SG)',
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
          name: '3 (SF)',
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
          name: '4 (PF)',
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
          name: '5 (C)',
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
  // 4. SLOB HAMMER (AUT BOCZNY)
  // ==========================================
  {
    name: 'SLOB Hammer (Aut boczny ze ścięciem)',
    category: 'slob',
    targetDefense: 'Obrona każdy swego (Man-to-Man)',
    description: 'Zagrywka z autu bocznego. Wjazd 2 (SG) wzdłuż linii ściąga pomoc, a zasłona Hammer 4 (PF) uwalnia strzelca 3 (SF) na trójkę w rogu.',
    tags: ['SLOB', 'Hammer Action', 'Spurs System', 'Corner 3'],
    diagramData: {
      duration: 8.5,
      outcomeText: '✨ CELNY RZUT ZA 3: POZYCJA 3 (SF) • +3 PKT',
      coachingKeys: [
        'Wprowadzenie piłki do wjeżdżającego pod kosz 2 (SG)',
        'Zasłona Hammer (T-Bar) 4 (PF) musi odciąć obrońcę D3 w rogu boiska',
        'Podanie drift pass wzdłuż linii końcowej wprost do rąk 3 (SF)'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie przy Linii Bocznej',
          description: 'Podający 1 (PG) na aucie bocznym. 2 (SG) przygotowuje się do odbioru piłki na prawym skrzydle.',
          coachingCues: ['Pewny chwyt', 'Mocny pierwszy krok']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Wjazd w Głąb & Zasłona Hammer 4 (PF) dla 3 (SF)',
          description: '2 (SG) atakuje koźłem wzdłuż linii końcowej. Na słabej stronie 4 (PF) stawia zasłonę Hammer (T-Bar) dla 3 (SF). D3 uderza w zasłonę!',
          coachingCues: ['Belka T-Bar tyłem do kosza', 'Sprint do narożnika']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Podanie Baseline Drift Pass do 3 (SF)',
          description: '2 (SG) z linii końcowej posyła laserowe podanie ponad obrońcami prosto w lewy narożnik do 3 (SF).',
          coachingCues: ['Podanie w tempo', 'Strzelec 3 (SF) gotowy do rzutu']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Czysta Trójka 3 (SF) w Rogu i Zbiórka',
          description: '3 (SF) trafia czysty rzut za 3 punkty (+3 PKT). Wysocy zabezpieczają deskę.',
          coachingCues: ['Catch & Shoot', 'Zbiórka ofensywna']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 1,
          name: '1 (PG)',
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
          name: '2 (SG)',
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
          name: '3 (SF)',
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
          name: '4 (PF)',
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
          name: '5 (C)',
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
  // 5. ELEVATOR DOORS ATO (PO CZASIE)
  // ==========================================
  {
    name: 'Elevator Doors ATO (Zasłona Windowa)',
    category: 'ato',
    targetDefense: 'Obrona każdy swego (Po czasie / Clutch)',
    description: 'Zagrywka po czasie. 2 (SG) sprintuje przez windę, 4 (PF) i 5 (C) zatrzaskują drzwi windy (T-Bar) blokując D2, a 2 (SG) trafia za 3 ze szczytu.',
    tags: ['ATO', 'Elevator Screen', 'Clutch', 'Warriors Action'],
    diagramData: {
      duration: 8.5,
      outcomeText: '✨ CELNY RZUT ZA 3: POZYCJA 2 (SG) • +3 PKT',
      coachingKeys: [
        'Zasłaniający 4 (PF) i 5 (C) muszą zewrzeć szyk dokładnie po przebiegnięciu 2 (SG)',
        'Podanie od 1 (PG) musi być posłane natychmiast na klatkę piersiową 2 (SG)',
        'Strzelec 2 (SG) bez obrońcy oddaje czysty rzut za 3 punkty'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Ustawienie Po Przerwie na Żądanie',
          description: '1 (PG) z piłką na lewym skrzydle. Strzelec 2 (SG) przyczajony pod koszem, wysocy 4 (PF) i 5 (C) rozstawieni na szczycie (otwarta winda).',
          coachingCues: ['Pełna koncentracja', 'Wysocy gotowi do zamknięcia windy']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Sprint 2 (SG) & Zatrzaśnięcie Drzwi Windy (T-Bar)',
          description: '2 (SG) sprintuje przez środek. W momencie minięcia 4 (PF) i 5 (C) zatrzaskują drzwi windy. Goniący D2 uderza w podwójną ścianę!',
          coachingCues: ['Podwójny T-Bar', 'Obrońca D2 całkowicie odcięty']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Podanie na Szczyt do 2 (SG) w Tempo',
          description: '1 (PG) posyła bezpośrednie podanie na klatkę piersiową 2 (SG) wybiegającego na czystą pozycję na szczycie.',
          coachingCues: ['Silne podanie', 'Złożenie się do rzutu']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Decydujący Rzut za 3 Punkty przez 2 (SG) (+3 PKT)',
          description: '2 (SG) bez presji oddaje rzut za 3 punkty. Piłka wpada czysto do kosza (+3 PKT).',
          coachingCues: ['Czysty rzut', 'Celebracja i powrót do obrony']
        }
      ],
      players: [
        {
          id: 'O1',
          number: 1,
          name: '1 (PG)',
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
          name: '2 (SG)',
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
          name: '3 (SF)',
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
          name: '4 (PF)',
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
          name: '5 (C)',
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
  // 6. NOWOŚĆ: OBRONA KAŻDY SWEGO 1VS1 (MAN-TO-MAN: HELP & RECOVER) (OBRONA)
  // =========================================================================
  {
    name: 'Obrona Każdy Swego 1vs1 (Help & Recover)',
    category: 'defense',
    targetDefense: 'Atak pozycyjny (Pick & Roll / Motion)',
    description: 'Agresywna obrona indywidualna 1vs1 z zasadami Help & Recover. Presja na piłce (On-Ball), odcięcie linii podań (Deny) oraz zbiegnięcie ze słabej strony do asekuracji (Nail & Help Line).',
    tags: ['Obrona 1vs1', 'Man-to-Man', 'Help & Recover', 'Nail Help', 'Zbiórka Defensywna'],
    diagramData: {
      duration: 8.5,
      outcomeText: '🛡️ SKUTECZNA OBRONA: WYMUSZONY BŁĄD 24s & ZBIÓRKA D5',
      coachingKeys: [
        'Obrońca na piłce (D1) w niskiej postawie wywiera presję i odcina środek',
        'Obrońcy o 1 podanie (D2, D3) w pozycji Deny nie pozwalają na łatwe podanie',
        'Obrońcy ze słabej strony (D4, D5) schodzą jedną nogą w trumnę (Help Line)',
        'Przy próbie wjazdu obrona zamyka korytarz, a na podanie doskakuje z wyciągniętą ręką (Closeout)'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Wyjściowe Ustawienie Defensywne & Presja On-Ball',
          description: 'D1 wywiera presję na kozłującym O1 na szczycie. D2 i D3 w pozycji Deny na skrzydłach, D4 i D5 asekurują trumnę.',
          coachingCues: ['Niski środek ciężkości', 'Aktywne ręce w korytarzu podania']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Próba Wjazdu O1 & Asekuracja na Linii Nail (D3 Help)',
          description: 'O1 próbuje ściąć w prawo. D3 schodzi z lewego skrzydła na linię rzutów wolnych (Nail Help) blokując wjazd. O1 zmuszony do podania na skrzydło do O2.',
          coachingCues: ['Nail Help powstrzymuje wjazd', 'Komunikacja głosowa obrony']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Dynamiczny Closeout D2 & Powrót Asekuracji (Recover)',
          description: 'Podanie do O2. D2 wykonuje dynamiczny doskok (Closeout) z ręką w górze. D3 natychmiast wraca (Recover) do swojego gracza O3. Korytarze odcięte!',
          coachingCues: ['Drobne kroki w closeoucie', 'Brak faulu przy wyskoku']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Wymuszony Niecelny Rzut pod Presją & Zbiórka D5',
          description: 'O2 pod presją zegara 24s oddaje trudny rzut przez ręce D2. Piłka odbija się od obręczy, D5 i D4 twardo zastawiają tablicę i zbierają piłkę.',
          coachingCues: ['Twarde zastawienie tyłem', 'Zbiórka oburącz w wyskoku']
        }
      ],
      players: [
        // Atakujący
        {
          id: 'O1',
          number: 1,
          name: '1 (PG)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 78, heading: 0, action: 'dribble' },
            { time: 1.5, x: 50, y: 78, heading: 0, action: 'dribble' },
            { time: 3.5, x: 58, y: 64, heading: 45, action: 'dribble' },
            { time: 5.0, x: 54, y: 68, heading: 90, action: 'idle' },
            { time: 8.5, x: 52, y: 72, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 2,
          name: '2 (SG)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 82, y: 60, heading: 270, action: 'idle' },
            { time: 3.5, x: 84, y: 55, heading: 270, action: 'idle' },
            { time: 5.5, x: 82, y: 52, heading: 270, action: 'catch' },
            { time: 6.5, x: 82, y: 52, heading: 300, action: 'shoot' },
            { time: 8.5, x: 82, y: 52, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 3,
          name: '3 (SF)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 18, y: 60, heading: 90, action: 'idle' },
            { time: 4.5, x: 14, y: 55, heading: 90, action: 'idle' },
            { time: 8.5, x: 14, y: 50, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 4,
          name: '4 (PF)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 26, y: 28, heading: 0, action: 'idle' },
            { time: 4.5, x: 30, y: 22, heading: 0, action: 'idle' },
            { time: 8.5, x: 40, y: 16, heading: 0, action: 'cut' }
          ]
        },
        {
          id: 'O5',
          number: 5,
          name: '5 (C)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 74, y: 28, heading: 0, action: 'idle' },
            { time: 4.5, x: 70, y: 22, heading: 0, action: 'idle' },
            { time: 8.5, x: 60, y: 16, heading: 0, action: 'cut' }
          ]
        },
        // Obrońcy 1vs1 (Man-to-Man)
        {
          id: 'D1',
          number: 1,
          name: 'D1',
          role: 'PG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 50, y: 72, heading: 180, action: 'defend' },
            { time: 1.5, x: 50, y: 72, heading: 180, action: 'defend' },
            { time: 3.5, x: 56, y: 58, heading: 180, action: 'defend' },
            { time: 5.5, x: 52, y: 62, heading: 140, action: 'defend' },
            { time: 8.5, x: 50, y: 64, heading: 180, action: 'defend' }
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
            { time: 3.5, x: 72, y: 52, heading: 240, action: 'defend' },
            { time: 5.5, x: 78, y: 48, heading: 90, action: 'defend' },
            { time: 6.8, x: 80, y: 49, heading: 90, action: 'defend' },
            { time: 8.5, x: 78, y: 48, heading: 0, action: 'defend' }
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
            { time: 3.5, x: 42, y: 54, heading: 90, action: 'defend' }, // Nail Help!
            { time: 5.5, x: 20, y: 52, heading: 270, action: 'defend' }, // Recover!
            { time: 8.5, x: 22, y: 46, heading: 0, action: 'defend' }
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
            { time: 3.5, x: 38, y: 26, heading: 90, action: 'defend' },
            { time: 6.5, x: 38, y: 16, heading: 0, action: 'defend' },
            { time: 8.5, x: 42, y: 14, heading: 0, action: 'defend' }
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
            { time: 3.5, x: 60, y: 24, heading: 270, action: 'defend' },
            { time: 6.5, x: 54, y: 16, heading: 0, action: 'defend' },
            { time: 8.5, x: 50, y: 14, heading: 0, action: 'defend' } // Zbiórka!
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 50, y: 78, holderId: 'O1' },
          { time: 1.5, x: 50, y: 78, holderId: 'O1' },
          { time: 3.5, x: 58, y: 64, holderId: 'O1' },
          { time: 5.0, x: 54, y: 68, holderId: 'O1' },
          { time: 5.5, x: 82, y: 52, holderId: 'O2', isPass: true, arcHeight: 0.2 },
          { time: 6.5, x: 82, y: 52, holderId: 'O2' },
          { time: 7.2, x: 50, y: 12.5, holderId: null, isShot: true, arcHeight: 1.2 }, // Niecelny rzut o tablicę
          { time: 7.8, x: 52, y: 15, holderId: null, isPass: true, arcHeight: 0.3 }, // Odbicie od obręczy
          { time: 8.5, x: 50, y: 14, holderId: 'D5' } // Chwyt piłki przez D5!
        ]
      }
    }
  },

  // =========================================================================
  // 7. NOWOŚĆ: OBRONA STREFOWA 2-3 (PRZESUNIĘCIA & ZASTAWIENIE ROGÓW) (OBRONA)
  // =========================================================================
  {
    name: 'Obrona Strefowa 2-3 (Przesunięcia & Zastawienie Rogów)',
    category: 'defense',
    targetDefense: 'Zespoły rzucające z dystansu i wjazdy w pomalowane',
    description: 'Klasyczna strefa 2-3 z wyznaczonymi 5 strefami odpowiedzialności. Obrońcy przesuwają się harmonijnie w rytm ruchu piłki (szczyt -> skrzydło -> róg), zagęszczając stronę silną i odcinając linie podań pod kosz.',
    tags: ['Strefa 2-3', 'Zone Defense', 'Przesunięcia strefowe', 'Paint Protection', 'Siatka Stref'],
    diagramData: {
      duration: 8.5,
      outcomeText: '🛡️ STREFA 2-3: PRZECHWYT PIŁKI PRZEZ D5 I KONTRATAK',
      zoneAreas: [
        {
          id: 'Z_D1',
          playerId: 'D1',
          label: 'D1: Szczyt Lewy',
          color: 'rgba(244, 63, 94, 0.08)',
          polygon: [{ x: 6, y: 50 }, { x: 50, y: 50 }, { x: 50, y: 88 }, { x: 6, y: 88 }]
        },
        {
          id: 'Z_D2',
          playerId: 'D2',
          label: 'D2: Szczyt Prawy',
          color: 'rgba(244, 63, 94, 0.08)',
          polygon: [{ x: 50, y: 50 }, { x: 94, y: 50 }, { x: 94, y: 88 }, { x: 50, y: 88 }]
        },
        {
          id: 'Z_D3',
          playerId: 'D3',
          label: 'D3: Lewy Róg & Skrzydło',
          color: 'rgba(236, 72, 153, 0.08)',
          polygon: [{ x: 4, y: 4 }, { x: 38, y: 4 }, { x: 38, y: 50 }, { x: 4, y: 50 }]
        },
        {
          id: 'Z_D4',
          playerId: 'D4',
          label: 'D4: Prawy Róg & Skrzydło',
          color: 'rgba(236, 72, 153, 0.08)',
          polygon: [{ x: 62, y: 4 }, { x: 96, y: 4 }, { x: 96, y: 50 }, { x: 62, y: 50 }]
        },
        {
          id: 'Z_D5',
          playerId: 'D5',
          label: 'D5: Pomalowane & Deska',
          color: 'rgba(168, 85, 247, 0.10)',
          polygon: [{ x: 38, y: 4 }, { x: 62, y: 4 }, { x: 62, y: 50 }, { x: 38, y: 50 }]
        }
      ],
      coachingKeys: [
        'Górna linia (D1, D2) przesuwa się w tandemie na szczycie łuku 3PT',
        'Podanie na prawe skrzydło: D2 doskakuje do piłki, D1 schodzi na Nail, D4 podchodzi pod linię rzutu',
        'Podanie w róg: D4 natychmiast zamyka róg (Corner Contest), D5 asekuruje linię końcową',
        'Center D5 w centrum trumny patroluje wjazdy i dominuje w walce na tablicach'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Wyjściowe Ustawienie w Strefie 2-3 (Piłka na Szczycie)',
          description: 'D1 i D2 na szczycie łuku, D5 w środku trumny, D3 i D4 na dolnych blokach. Spójna formacja blokująca środek.',
          coachingCues: ['Szerokie rozstawienie rąk', 'Wszyscy widzą piłkę']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Podanie na Prawe Skrzydło & Przesunięcie Strefowe',
          description: 'O1 podaje do O2 na prawe skrzydło. D2 wykonuje doskok, D1 zbiega na Nail (szczyt trumny), D4 podchodzi wyżej, D5 przesuwa się na prawy blok.',
          coachingCues: ['Brak dziury w środku', 'D1 na Nail pilnuje łokcia']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Podanie w Prawy Róg do O4 & Podwójne Zamknięcie Rogu',
          description: 'O2 podaje do O4 w róg. D4 doskakuje do rzutu, D5 blokuje korytarz wzdłuż linii końcowej, D2 cofa się do łokcia trumny, D3 pilnuje weak-side.',
          coachingCues: ['Odcięcie linii końcowej', 'Brak faulu przy linii']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Wymuszone Złe Podanie & Przechwyt Piłki przez D5',
          description: 'O4 odcięty w rogu próbuje podać w pomalowane. D5 czyta intencję, przejmuje piłkę w powietrzu (Steal) i uruchamia szybki atak!',
          coachingCues: ['Antycypacja podania', 'Natychmiastowe wyprowadzenie kontry']
        }
      ],
      players: [
        // Atak
        {
          id: 'O1',
          number: 1,
          name: '1 (PG)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 80, heading: 0, action: 'idle' },
            { time: 1.5, x: 50, y: 80, heading: 0, action: 'idle' },
            { time: 3.5, x: 55, y: 78, heading: 60, action: 'idle' },
            { time: 8.5, x: 52, y: 78, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 2,
          name: '2 (SG)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 82, y: 64, heading: 270, action: 'idle' },
            { time: 2.5, x: 82, y: 64, heading: 270, action: 'catch' },
            { time: 4.5, x: 84, y: 60, heading: 180, action: 'idle' },
            { time: 8.5, x: 80, y: 62, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 3,
          name: '3 (SF)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 18, y: 64, heading: 90, action: 'idle' },
            { time: 8.5, x: 18, y: 60, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 4,
          name: '4 (PF)',
          role: 'PF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 90, y: 22, heading: 270, action: 'idle' },
            { time: 4.5, x: 90, y: 16, heading: 270, action: 'catch' },
            { time: 6.5, x: 90, y: 16, heading: 220, action: 'idle' },
            { time: 8.5, x: 90, y: 16, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O5',
          number: 5,
          name: '5 (C)',
          role: 'C',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 38, heading: 0, action: 'idle' },
            { time: 4.5, x: 58, y: 30, heading: 90, action: 'cut' },
            { time: 8.5, x: 56, y: 24, heading: 0, action: 'idle' }
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
            { time: 0.0, x: 42, y: 68, heading: 180, action: 'defend' },
            { time: 1.5, x: 42, y: 68, heading: 180, action: 'defend' },
            { time: 3.5, x: 48, y: 58, heading: 120, action: 'defend' }, // Przesunięcie na Nail
            { time: 5.5, x: 46, y: 52, heading: 120, action: 'defend' },
            { time: 8.5, x: 46, y: 52, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D2',
          number: 2,
          name: 'D2',
          role: 'SG',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 58, y: 68, heading: 180, action: 'defend' },
            { time: 1.5, x: 58, y: 68, heading: 180, action: 'defend' },
            { time: 3.5, x: 74, y: 62, heading: 90, action: 'defend' }, // Doskok do skrzydła
            { time: 5.5, x: 68, y: 48, heading: 140, action: 'defend' }, // Cofnięcie do łokcia
            { time: 8.5, x: 68, y: 48, heading: 0, action: 'defend' }
          ]
        },
        {
          id: 'D3',
          number: 3,
          name: 'D3',
          role: 'SF',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 22, y: 30, heading: 180, action: 'defend' },
            { time: 3.5, x: 28, y: 26, heading: 90, action: 'defend' },
            { time: 5.5, x: 36, y: 20, heading: 90, action: 'defend' }, // Zabezpieczenie słabej strony trumny
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
            { time: 0.0, x: 78, y: 30, heading: 180, action: 'defend' },
            { time: 3.5, x: 80, y: 42, heading: 90, action: 'defend' }, // Podbicie wyżej w skrzydło
            { time: 5.5, x: 88, y: 20, heading: 90, action: 'defend' }, // Doskok w róg
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
            { time: 0.0, x: 50, y: 24, heading: 180, action: 'defend' },
            { time: 3.5, x: 54, y: 24, heading: 90, action: 'defend' },
            { time: 5.5, x: 60, y: 18, heading: 90, action: 'defend' }, // Zabezpieczenie linii końcowej
            { time: 6.8, x: 56, y: 22, heading: 45, action: 'defend' }, // Przechwyt podania!
            { time: 8.5, x: 52, y: 30, heading: 0, action: 'dribble' } // Start kontrataku
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 50, y: 80, holderId: 'O1' },
          { time: 1.5, x: 50, y: 80, holderId: 'O1' },
          { time: 2.5, x: 82, y: 64, holderId: 'O2', isPass: true, arcHeight: 0.2 },
          { time: 4.5, x: 84, y: 60, holderId: 'O2' },
          { time: 5.2, x: 90, y: 16, holderId: 'O4', isPass: true, arcHeight: 0.2 },
          { time: 6.2, x: 90, y: 16, holderId: 'O4' },
          { time: 6.8, x: 56, y: 22, holderId: 'D5', isPass: true, arcHeight: 0.15 }, // Przechwyt D5!
          { time: 8.5, x: 52, y: 30, holderId: 'D5' }
        ]
      }
    }
  },

  // =========================================================================
  // 8. NOWOŚĆ: OBRONA STREFOWA 3-2 (ODCIĘCIE OBWODU & ROTACJE PODKOSZOWE) (OBRONA)
  // =========================================================================
  {
    name: 'Obrona Strefowa 3-2 (Odcięcie Obwodu & Rotacje)',
    category: 'defense',
    targetDefense: 'Zespoły bazujące na rzutach za 3 (High Spacing / 5-Out)',
    description: 'Agresywna strefa 3-2 nastawiona na całkowite zablokowanie rzutów za 3 punkty. Trzej górni obrońcy (D1, D2, D3) tworzą nieprzenikniony mur na łuku 3PT, a dwaj wysocy (D4, D5) rotują pod koszem i zabezpieczają zbiórkę.',
    tags: ['Strefa 3-2', 'Zone Defense', 'Odcięcie 3PT', 'Perimeter Lock', 'Blok Rzutu'],
    diagramData: {
      duration: 8.5,
      outcomeText: '🛡️ STREFA 3-2: ZABLOKOWANY RZUT ZA 3 (BLOK D2)',
      zoneAreas: [
        {
          id: 'Z_D1',
          playerId: 'D1',
          label: 'D1: Szczyt 3PT',
          color: 'rgba(59, 130, 246, 0.08)',
          polygon: [{ x: 30, y: 64 }, { x: 70, y: 64 }, { x: 70, y: 92 }, { x: 30, y: 92 }]
        },
        {
          id: 'Z_D2',
          playerId: 'D2',
          label: 'D2: Prawe Skrzydło 3PT',
          color: 'rgba(59, 130, 246, 0.08)',
          polygon: [{ x: 65, y: 36 }, { x: 96, y: 36 }, { x: 96, y: 78 }, { x: 65, y: 78 }]
        },
        {
          id: 'Z_D3',
          playerId: 'D3',
          label: 'D3: Lewe Skrzydło 3PT',
          color: 'rgba(59, 130, 246, 0.08)',
          polygon: [{ x: 4, y: 36 }, { x: 35, y: 36 }, { x: 35, y: 78 }, { x: 4, y: 78 }]
        },
        {
          id: 'Z_D4',
          playerId: 'D4',
          label: 'D4: Prawy Dół & Róg',
          color: 'rgba(16, 185, 129, 0.08)',
          polygon: [{ x: 50, y: 4 }, { x: 96, y: 4 }, { x: 96, y: 36 }, { x: 50, y: 36 }]
        },
        {
          id: 'Z_D5',
          playerId: 'D5',
          label: 'D5: Lewy Dół & Róg',
          color: 'rgba(16, 185, 129, 0.08)',
          polygon: [{ x: 4, y: 4 }, { x: 50, y: 4 }, { x: 50, y: 36 }, { x: 4, y: 36 }]
        }
      ],
      coachingKeys: [
        'Trzej górni gracze (D1, D2, D3) ściśle kryją obwód – brak miejsca na rzut za 3',
        'Przy podaniu na skrzydło: D2 doskakuje wysoko, D1 zabezpiecza środek, D4 pilnuje dołu',
        'Przy próbie wymuszonego rzutu przez ręce: D2 wykonuje wyskok z blokiem',
        'D4 i D5 kontrolują strefę podkoszową i zabezpieczają zbiórkę'
      ],
      phaseDirectives: [
        {
          startTime: 0.0,
          endTime: 1.5,
          title: 'Faza 1: Wyjściowy Mur Obwodowy 3-2',
          description: 'D1 na szczycie, D2 na prawym skrzydle, D3 na lewym skrzydle. D4 i D5 w trumnie. Pełne pokrycie linii rzutów za 3 punkty.',
          coachingCues: ['Wysokie ręce na obwodzie', 'Ciasny rozstaw trójki obwodowej']
        },
        {
          startTime: 1.5,
          endTime: 4.5,
          title: 'Faza 2: Krążenie Piłki po Obwodzie (O1 -> O3 -> O1)',
          description: 'O1 podaje do O3 na lewe skrzydło. D3 natychmiast doskakuje, D1 asekuruje lewy łokieć. O3 nie ma miejsca na rzut i odgrywa z powrotem na szczyt.',
          coachingCues: ['Brak miejsca na rzut', 'Szybka rotacja górnej trójki']
        },
        {
          startTime: 4.5,
          endTime: 6.5,
          title: 'Faza 3: Przerzut na Prawe Skrzydło do O2 & Wyskoczenie D2',
          description: 'O1 posyła szybkie podanie na prawe skrzydło do O2. D2 sprintuje w closeoucie, uniemożliwiając czyste złożenie się do rzutu.',
          coachingCues: ['Sprint w obronie', 'Wyskok pionowy bez kontaktu ciał']
        },
        {
          startTime: 6.5,
          endTime: 8.5,
          title: 'Faza 4: Efektowny Blok Rzutu za 3 przez D2 & Zabezpieczenie D4',
          description: 'O2 decyduje się na rzut z dystansu, lecz D2 blokuje piłkę w powietrzu! Odbitą piłkę pod koszem zbiera D4.',
          coachingCues: ['Czysty blok czubkami palców', 'Zabezpieczenie bezpańskiej piłki']
        }
      ],
      players: [
        // Atak
        {
          id: 'O1',
          number: 1,
          name: '1 (PG)',
          role: 'PG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 50, y: 82, heading: 0, action: 'idle' },
            { time: 1.5, x: 50, y: 82, heading: 0, action: 'idle' },
            { time: 3.5, x: 44, y: 80, heading: 270, action: 'idle' },
            { time: 5.0, x: 50, y: 80, heading: 90, action: 'idle' },
            { time: 8.5, x: 50, y: 80, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O2',
          number: 2,
          name: '2 (SG)',
          role: 'SG',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 80, y: 64, heading: 270, action: 'idle' },
            { time: 4.5, x: 82, y: 62, heading: 270, action: 'idle' },
            { time: 5.5, x: 82, y: 62, heading: 270, action: 'catch' },
            { time: 6.5, x: 82, y: 62, heading: 0, action: 'shoot' },
            { time: 8.5, x: 82, y: 62, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O3',
          number: 3,
          name: '3 (SF)',
          role: 'SF',
          isOffense: true,
          keyframes: [
            { time: 0.0, x: 20, y: 64, heading: 90, action: 'idle' },
            { time: 2.2, x: 18, y: 62, heading: 90, action: 'catch' },
            { time: 3.5, x: 18, y: 62, heading: 45, action: 'idle' },
            { time: 8.5, x: 18, y: 62, heading: 0, action: 'idle' }
          ]
        },
        {
          id: 'O4',
          number: 4,
          name: '4 (PF)',
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
          name: '5 (C)',
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
            { time: 0.0, x: 50, y: 74, heading: 180, action: 'defend' },
            { time: 1.5, x: 50, y: 74, heading: 180, action: 'defend' },
            { time: 2.5, x: 38, y: 68, heading: 240, action: 'defend' }, // Asekuracja lewego skrzydła
            { time: 5.0, x: 60, y: 70, heading: 120, action: 'defend' }, // Asekuracja prawego skrzydła
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
            { time: 0.0, x: 72, y: 62, heading: 180, action: 'defend' },
            { time: 2.5, x: 62, y: 56, heading: 240, action: 'defend' }, // Przesunięcie do środka
            { time: 5.5, x: 76, y: 60, heading: 90, action: 'defend' },  // Doskok w closeoucie
            { time: 6.8, x: 78, y: 60, heading: 90, action: 'defend' },  // Blok rzutu!
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
            { time: 0.0, x: 28, y: 62, heading: 180, action: 'defend' },
            { time: 2.5, x: 22, y: 60, heading: 270, action: 'defend' }, // Doskok na lewym skrzydle
            { time: 5.0, x: 34, y: 56, heading: 140, action: 'defend' }, // Przesunięcie do środka
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
            { time: 0.0, x: 64, y: 26, heading: 180, action: 'defend' },
            { time: 4.5, x: 66, y: 24, heading: 90, action: 'defend' },
            { time: 7.0, x: 58, y: 20, heading: 0, action: 'defend' },
            { time: 8.5, x: 54, y: 16, heading: 0, action: 'defend' } // Chwyt zablokowanej piłki
          ]
        },
        {
          id: 'D5',
          number: 5,
          name: 'D5',
          role: 'C',
          isOffense: false,
          keyframes: [
            { time: 0.0, x: 36, y: 26, heading: 180, action: 'defend' },
            { time: 2.5, x: 30, y: 24, heading: 270, action: 'defend' },
            { time: 5.5, x: 44, y: 20, heading: 90, action: 'defend' },
            { time: 8.5, x: 46, y: 16, heading: 0, action: 'defend' }
          ]
        }
      ],
      ball: {
        keyframes: [
          { time: 0.0, x: 50, y: 82, holderId: 'O1' },
          { time: 1.5, x: 50, y: 82, holderId: 'O1' },
          { time: 2.2, x: 18, y: 62, holderId: 'O3', isPass: true, arcHeight: 0.2 },
          { time: 3.5, x: 18, y: 62, holderId: 'O3' },
          { time: 4.2, x: 50, y: 80, holderId: 'O1', isPass: true, arcHeight: 0.2 },
          { time: 4.8, x: 50, y: 80, holderId: 'O1' },
          { time: 5.5, x: 82, y: 62, holderId: 'O2', isPass: true, arcHeight: 0.25 },
          { time: 6.5, x: 82, y: 62, holderId: 'O2' },
          { time: 6.8, x: 78, y: 60, holderId: null, isShot: true, arcHeight: 0.2 }, // Rzut zablokowany przez D2 na 78, 60
          { time: 7.6, x: 58, y: 22, holderId: null, isPass: true, arcHeight: 0.4 }, // Zablokowana piłka leci w trumnę
          { time: 8.5, x: 54, y: 16, holderId: 'D4' } // Zabezpieczenie przez D4!
        ]
      }
    }
  }
];
