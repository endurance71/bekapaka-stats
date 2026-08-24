/**
 * Gotowe presety animowanych zagrywek koszykarskich (BeKaPaKa Playbook Library).
 * Każda zagrywka zawiera pełne definicje faz (steps) ze współrzędnymi tokenów (0-100 x 0-100) i trajektoriami.
 */

export const DEFAULT_PLAYBOOK_PRESETS = [
  {
    name: 'Horns Flare vs Strefa 2-3',
    category: 'half_court',
    targetDefense: 'Strefa 2-3',
    description: 'Klasyczne ustawienie Rogów (Horns) rozbijające pierwszą linię strefy. Zasłona bez piłki (flare) na szczycie uwalnia strzelca w rogu boiska.',
    tags: ['Horns', 'Strefa 2-3', 'Corner 3', 'Rzut za 3'],
    diagramData: {
      tokens: [
        { id: 'O1', label: '1', role: 'PG', x: 50, y: 82, isOffense: true },
        { id: 'O2', label: '2', role: 'SG', x: 18, y: 65, isOffense: true },
        { id: 'O3', label: '3', role: 'SF', x: 82, y: 65, isOffense: true },
        { id: 'O4', label: '4', role: 'PF', x: 35, y: 40, isOffense: true },
        { id: 'O5', label: '5', role: 'C', x: 65, y: 40, isOffense: true },
        { id: 'D1', label: 'D1', x: 42, y: 70, isOffense: false },
        { id: 'D2', label: 'D2', x: 58, y: 70, isOffense: false },
        { id: 'D3', label: 'D3', x: 22, y: 40, isOffense: false },
        { id: 'D4', label: 'D4', x: 50, y: 30, isOffense: false },
        { id: 'D5', label: 'D5', x: 78, y: 40, isOffense: false },
        { id: 'BALL', label: '🏀', x: 52, y: 80, isOffense: true, isBall: true }
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Krok 1: Inicjacja Horns & Atak Koźłem',
          description: 'Rozgrywający (1) atakuje koźłem na prawe skrzydło, ściągając na siebie górnego obrońcę strefy (D2).',
          tokens: [
            { id: 'O1', label: '1', role: 'PG', x: 65, y: 72, isOffense: true },
            { id: 'O2', label: '2', role: 'SG', x: 18, y: 65, isOffense: true },
            { id: 'O3', label: '3', role: 'SF', x: 82, y: 65, isOffense: true },
            { id: 'O4', label: '4', role: 'PF', x: 35, y: 40, isOffense: true },
            { id: 'O5', label: '5', role: 'C', x: 65, y: 40, isOffense: true },
            { id: 'D1', label: 'D1', x: 48, y: 68, isOffense: false },
            { id: 'D2', label: 'D2', x: 64, y: 65, isOffense: false },
            { id: 'D3', label: 'D3', x: 22, y: 40, isOffense: false },
            { id: 'D4', label: 'D4', x: 50, y: 30, isOffense: false },
            { id: 'D5', label: 'D5', x: 78, y: 40, isOffense: false },
            { id: 'BALL', label: '🏀', x: 67, y: 70, isOffense: true, isBall: true }
          ],
          strokes: [
            { id: 's1', from: { x: 50, y: 82 }, to: { x: 65, y: 72 }, type: 'dribble' }
          ]
        },
        {
          stepNumber: 2,
          title: 'Krok 2: Zasłona Flare & Ścięcie Strzelca',
          description: 'Środkowy (5) stawia twardą zasłonę flare na szczycie. Skrzydłowy (3) ścina w róg boiska (Corner).',
          tokens: [
            { id: 'O1', label: '1', role: 'PG', x: 65, y: 72, isOffense: true },
            { id: 'O2', label: '2', role: 'SG', x: 25, y: 75, isOffense: true },
            { id: 'O3', label: '3', role: 'SF', x: 90, y: 22, isOffense: true },
            { id: 'O4', label: '4', role: 'PF', x: 45, y: 35, isOffense: true },
            { id: 'O5', label: '5', role: 'C', x: 75, y: 60, isOffense: true },
            { id: 'D1', label: 'D1', x: 52, y: 65, isOffense: false },
            { id: 'D2', label: 'D2', x: 74, y: 60, isOffense: false },
            { id: 'D3', label: 'D3', x: 25, y: 40, isOffense: false },
            { id: 'D4', label: 'D4', x: 50, y: 28, isOffense: false },
            { id: 'D5', label: 'D5', x: 72, y: 30, isOffense: false },
            { id: 'BALL', label: '🏀', x: 67, y: 70, isOffense: true, isBall: true }
          ],
          strokes: [
            { id: 's2', from: { x: 65, y: 40 }, to: { x: 75, y: 60 }, type: 'screen' },
            { id: 's3', from: { x: 82, y: 65 }, to: { x: 90, y: 22 }, type: 'cut' }
          ]
        },
        {
          stepNumber: 3,
          title: 'Krok 3: Skip Pass & Czysty Rzut za 3',
          description: 'Rozgrywający (1) dogrywa skip pass do rogu dla niekrytego (3). Środkowy (5) roluje pod kosz na zbiórkę ofensywną.',
          tokens: [
            { id: 'O1', label: '1', role: 'PG', x: 65, y: 72, isOffense: true },
            { id: 'O2', label: '2', role: 'SG', x: 25, y: 75, isOffense: true },
            { id: 'O3', label: '3', role: 'SF', x: 90, y: 22, isOffense: true },
            { id: 'O4', label: '4', role: 'PF', x: 45, y: 25, isOffense: true },
            { id: 'O5', label: '5', role: 'C', x: 55, y: 22, isOffense: true },
            { id: 'D1', label: 'D1', x: 52, y: 65, isOffense: false },
            { id: 'D2', label: 'D2', x: 74, y: 55, isOffense: false },
            { id: 'D3', label: 'D3', x: 30, y: 30, isOffense: false },
            { id: 'D4', label: 'D4', x: 50, y: 20, isOffense: false },
            { id: 'D5', label: 'D5', x: 84, y: 24, isOffense: false },
            { id: 'BALL', label: '🏀', x: 90, y: 22, isOffense: true, isBall: true }
          ],
          strokes: [
            { id: 's4', from: { x: 65, y: 72 }, to: { x: 90, y: 22 }, type: 'pass' }
          ]
        }
      ],
      coachingKeys: [
        'Zasłona na szczycie musi zablokować powrót obrońcy strefy',
        'Podanie typu skip pass musi być posłane silnie i bezpośrednio do rąk',
        'Skrzydłowy w rogu musi być gotowy do natychmiastowego rzutu (Catch & Shoot)'
      ]
    }
  },
  {
    name: 'Spain Pick & Roll (Zasłona z pleców)',
    category: 'half_court',
    targetDefense: 'Obrona każdy swego (Drop / Switch)',
    description: 'Najskuteczniejsza zagrywka współczesnego basketu: klasyczny Pick & Roll uzupełniony o tylną zasłonę (backscreen) dla obrońcy środkowego.',
    tags: ['Spain PnR', 'Pick & Roll', 'Backscreen', 'EuroLeague'],
    diagramData: {
      tokens: [
        { id: 'O1', label: '1', role: 'PG', x: 50, y: 82, isOffense: true },
        { id: 'O2', label: '2', role: 'SG', x: 18, y: 70, isOffense: true },
        { id: 'O3', label: '3', role: 'SF', x: 50, y: 55, isOffense: true },
        { id: 'O4', label: '4', role: 'PF', x: 85, y: 30, isOffense: true },
        { id: 'O5', label: '5', role: 'C', x: 60, y: 75, isOffense: true },
        { id: 'D1', label: 'D1', x: 50, y: 76, isOffense: false },
        { id: 'D2', label: 'D2', x: 22, y: 65, isOffense: false },
        { id: 'D3', label: 'D3', x: 52, y: 50, isOffense: false },
        { id: 'D4', label: 'D4', x: 80, y: 30, isOffense: false },
        { id: 'D5', label: 'D5', x: 58, y: 70, isOffense: false },
        { id: 'BALL', label: '🏀', x: 52, y: 80, isOffense: true, isBall: true }
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Krok 1: Pick & Roll na Szczycie',
          description: '(5) stawia zasłonę na piłce dla (1). Rozgrywający wchodzi w głąb boiska.',
          tokens: [
            { id: 'O1', label: '1', role: 'PG', x: 38, y: 65, isOffense: true },
            { id: 'O2', label: '2', role: 'SG', x: 18, y: 70, isOffense: true },
            { id: 'O3', label: '3', role: 'SF', x: 50, y: 55, isOffense: true },
            { id: 'O4', label: '4', role: 'PF', x: 85, y: 30, isOffense: true },
            { id: 'O5', label: '5', role: 'C', x: 48, y: 72, isOffense: true },
            { id: 'D1', label: 'D1', x: 42, y: 70, isOffense: false },
            { id: 'D2', label: 'D2', x: 22, y: 65, isOffense: false },
            { id: 'D3', label: 'D3', x: 52, y: 50, isOffense: false },
            { id: 'D4', label: 'D4', x: 80, y: 30, isOffense: false },
            { id: 'D5', label: 'D5', x: 45, y: 60, isOffense: false },
            { id: 'BALL', label: '🏀', x: 40, y: 63, isOffense: true, isBall: true }
          ],
          strokes: [
            { id: 'sp1', from: { x: 50, y: 82 }, to: { x: 38, y: 65 }, type: 'dribble' },
            { id: 'sp2', from: { x: 60, y: 75 }, to: { x: 48, y: 72 }, type: 'screen' }
          ]
        },
        {
          stepNumber: 2,
          title: 'Krok 2: Hiszpańska Zasłona z Pleców (Backscreen)',
          description: 'Gdy (5) roluje pod kosz, strzelec (3) stawia zasłonę w plecy obrońcy środkowego (D5).',
          tokens: [
            { id: 'O1', label: '1', role: 'PG', x: 38, y: 65, isOffense: true },
            { id: 'O2', label: '2', role: 'SG', x: 18, y: 70, isOffense: true },
            { id: 'O3', label: '3', role: 'SF', x: 48, y: 52, isOffense: true },
            { id: 'O4', label: '4', role: 'PF', x: 85, y: 30, isOffense: true },
            { id: 'O5', label: '5', role: 'C', x: 50, y: 25, isOffense: true },
            { id: 'D1', label: 'D1', x: 40, y: 68, isOffense: false },
            { id: 'D2', label: 'D2', x: 22, y: 65, isOffense: false },
            { id: 'D3', label: 'D3', x: 55, y: 60, isOffense: false },
            { id: 'D4', label: 'D4', x: 80, y: 30, isOffense: false },
            { id: 'D5', label: 'D5', x: 48, y: 48, isOffense: false },
            { id: 'BALL', label: '🏀', x: 40, y: 63, isOffense: true, isBall: true }
          ],
          strokes: [
            { id: 'sp3', from: { x: 50, y: 55 }, to: { x: 48, y: 52 }, type: 'screen' },
            { id: 'sp4', from: { x: 48, y: 72 }, to: { x: 50, y: 25 }, type: 'cut' }
          ]
        },
        {
          stepNumber: 3,
          title: 'Krok 3: Pop na Trójkę lub Wsypka Pod Kosz',
          description: '(1) ma 2 opcje: bezpośrednie podanie do wolnego (5) pod kosz lub odegranie na szczyt do (3) na rzut za 3.',
          tokens: [
            { id: 'O1', label: '1', role: 'PG', x: 38, y: 65, isOffense: true },
            { id: 'O2', label: '2', role: 'SG', x: 18, y: 70, isOffense: true },
            { id: 'O3', label: '3', role: 'SF', x: 58, y: 75, isOffense: true },
            { id: 'O4', label: '4', role: 'PF', x: 85, y: 30, isOffense: true },
            { id: 'O5', label: '5', role: 'C', x: 50, y: 18, isOffense: true },
            { id: 'D1', label: 'D1', x: 40, y: 68, isOffense: false },
            { id: 'D2', label: 'D2', x: 22, y: 65, isOffense: false },
            { id: 'D3', label: 'D3', x: 55, y: 60, isOffense: false },
            { id: 'D4', label: 'D4', x: 80, y: 30, isOffense: false },
            { id: 'D5', label: 'D5', x: 48, y: 30, isOffense: false },
            { id: 'BALL', label: '🏀', x: 50, y: 18, isOffense: true, isBall: true }
          ],
          strokes: [
            { id: 'sp5', from: { x: 38, y: 65 }, to: { x: 50, y: 18 }, type: 'pass' },
            { id: 'sp6', from: { x: 48, y: 52 }, to: { x: 58, y: 75 }, type: 'cut' }
          ]
        }
      ],
      coachingKeys: [
        'Zasłona z pleców musi być precyzyjnie wklejona w obrońcę podkoszowego',
        'Strzelec po postawieniu zasłony natychmiast ucieka na szczyt (Pop)',
        'Rozgrywający czyta pierwszą pomoc obrony i decyduje w ułamku sekundy'
      ]
    }
  },
  {
    name: 'Box Cross BLOB (Aut spod kosza)',
    category: 'blob',
    targetDefense: 'Obrona każdy swego (Man-to-Man)',
    description: 'Zagrywka ze stałego fragmentu gry zza linii końcowej w formacji Box. Podwójna zasłona krzyżowa uwalnia centra wprost pod samą obręcz.',
    tags: ['BLOB', 'Box Set', 'Layup', 'Punkty z pomalowanego'],
    diagramData: {
      tokens: [
        { id: 'O1', label: '1', role: 'PG', x: 50, y: 4, isOffense: true },
        { id: 'O2', label: '2', role: 'SG', x: 35, y: 35, isOffense: true },
        { id: 'O3', label: '3', role: 'SF', x: 65, y: 35, isOffense: true },
        { id: 'O4', label: '4', role: 'PF', x: 35, y: 18, isOffense: true },
        { id: 'O5', label: '5', role: 'C', x: 65, y: 18, isOffense: true },
        { id: 'D1', label: 'D1', x: 50, y: 10, isOffense: false },
        { id: 'D2', label: 'D2', x: 35, y: 30, isOffense: false },
        { id: 'D3', label: 'D3', x: 65, y: 30, isOffense: false },
        { id: 'D4', label: 'D4', x: 35, y: 14, isOffense: false },
        { id: 'D5', label: 'D5', x: 65, y: 14, isOffense: false },
        { id: 'BALL', label: '🏀', x: 50, y: 4, isOffense: true, isBall: true }
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Krok 1: Podwójna Zasłona Krzyżowa',
          description: '(4) stawia zasłonę wzdłuż linii końcowej dla (5), a (3) stawia zasłonę dla (2) na obwód.',
          tokens: [
            { id: 'O1', label: '1', role: 'PG', x: 50, y: 4, isOffense: true },
            { id: 'O2', label: '2', role: 'SG', x: 75, y: 65, isOffense: true },
            { id: 'O3', label: '3', role: 'SF', x: 50, y: 35, isOffense: true },
            { id: 'O4', label: '4', role: 'PF', x: 50, y: 18, isOffense: true },
            { id: 'O5', label: '5', role: 'C', x: 35, y: 14, isOffense: true },
            { id: 'D1', label: 'D1', x: 50, y: 10, isOffense: false },
            { id: 'D2', label: 'D2', x: 70, y: 55, isOffense: false },
            { id: 'D3', label: 'D3', x: 52, y: 30, isOffense: false },
            { id: 'D4', label: 'D4', x: 50, y: 14, isOffense: false },
            { id: 'D5', label: 'D5', x: 45, y: 16, isOffense: false },
            { id: 'BALL', label: '🏀', x: 50, y: 4, isOffense: true, isBall: true }
          ],
          strokes: [
            { id: 'b1', from: { x: 35, y: 18 }, to: { x: 50, y: 18 }, type: 'screen' },
            { id: 'b2', from: { x: 65, y: 18 }, to: { x: 35, y: 14 }, type: 'cut' },
            { id: 'b3', from: { x: 35, y: 35 }, to: { x: 75, y: 65 }, type: 'cut' }
          ]
        },
        {
          stepNumber: 2,
          title: 'Krok 2: Dogranie Pod Kosz i Łatwy Layup',
          description: '(1) posyła bezpośrednie podanie lobem lub kozłem do wolnego (5) pod obręczą na 2 punkty.',
          tokens: [
            { id: 'O1', label: '1', role: 'PG', x: 50, y: 4, isOffense: true },
            { id: 'O2', label: '2', role: 'SG', x: 75, y: 65, isOffense: true },
            { id: 'O3', label: '3', role: 'SF', x: 50, y: 35, isOffense: true },
            { id: 'O4', label: '4', role: 'PF', x: 50, y: 18, isOffense: true },
            { id: 'O5', label: '5', role: 'C', x: 45, y: 14, isOffense: true },
            { id: 'D1', label: 'D1', x: 50, y: 10, isOffense: false },
            { id: 'D2', label: 'D2', x: 70, y: 55, isOffense: false },
            { id: 'D3', label: 'D3', x: 52, y: 30, isOffense: false },
            { id: 'D4', label: 'D4', x: 50, y: 14, isOffense: false },
            { id: 'D5', label: 'D5', x: 55, y: 16, isOffense: false },
            { id: 'BALL', label: '🏀', x: 45, y: 14, isOffense: true, isBall: true }
          ],
          strokes: [
            { id: 'b4', from: { x: 50, y: 4 }, to: { x: 45, y: 14 }, type: 'pass' }
          ]
        }
      ],
      coachingKeys: [
        'Zasłona na linii końcowej musi być postawiona legalnie z mocnym kontaktem',
        'Podający czeka dokładnie do momentu minięcia zasłony przez centra',
        'Gracz (2) jest opcją awaryjną na obwodzie (Safety)'
      ]
    }
  },
  {
    name: 'SLOB Hammer (Aut boczny ze ścięciem)',
    category: 'slob',
    targetDefense: 'Obrona każdy swego (Man-to-Man)',
    description: 'Zagrywka z autu bocznego. Wjazd na kosz z silnej strony zmusza obronę do pomocy, a zasłona Hammer na słabej stronie otwiera czysty rzut w rogu.',
    tags: ['SLOB', 'Hammer Action', 'Spurs System', 'Corner 3'],
    diagramData: {
      tokens: [
        { id: 'O1', label: '1', role: 'PG', x: 96, y: 60, isOffense: true },
        { id: 'O2', label: '2', role: 'SG', x: 75, y: 70, isOffense: true },
        { id: 'O3', label: '3', role: 'SF', x: 25, y: 70, isOffense: true },
        { id: 'O4', label: '4', role: 'PF', x: 30, y: 35, isOffense: true },
        { id: 'O5', label: '5', role: 'C', x: 60, y: 40, isOffense: true },
        { id: 'D1', label: 'D1', x: 90, y: 60, isOffense: false },
        { id: 'D2', label: 'D2', x: 70, y: 65, isOffense: false },
        { id: 'D3', label: 'D3', x: 25, y: 60, isOffense: false },
        { id: 'D4', label: 'D4', x: 30, y: 30, isOffense: false },
        { id: 'D5', label: 'D5', x: 60, y: 35, isOffense: false },
        { id: 'BALL', label: '🏀', x: 96, y: 60, isOffense: true, isBall: true }
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Krok 1: Wprowadzenie & Wjazd w Głąb',
          description: '(1) podaje do (2), po czym (2) dynamicznie atakuje wzdłuż prawej linii końcowej w stronę kosza.',
          tokens: [
            { id: 'O1', label: '1', role: 'PG', x: 80, y: 75, isOffense: true },
            { id: 'O2', label: '2', role: 'SG', x: 78, y: 25, isOffense: true },
            { id: 'O3', label: '3', role: 'SF', x: 25, y: 70, isOffense: true },
            { id: 'O4', label: '4', role: 'PF', x: 20, y: 35, isOffense: true },
            { id: 'O5', label: '5', role: 'C', x: 50, y: 30, isOffense: true },
            { id: 'D1', label: 'D1', x: 80, y: 70, isOffense: false },
            { id: 'D2', label: 'D2', x: 75, y: 32, isOffense: false },
            { id: 'D3', label: 'D3', x: 28, y: 55, isOffense: false },
            { id: 'D4', label: 'D4', x: 25, y: 32, isOffense: false },
            { id: 'D5', label: 'D5', x: 55, y: 28, isOffense: false },
            { id: 'BALL', label: '🏀', x: 78, y: 25, isOffense: true, isBall: true }
          ],
          strokes: [
            { id: 'h1', from: { x: 96, y: 60 }, to: { x: 75, y: 70 }, type: 'pass' },
            { id: 'h2', from: { x: 75, y: 70 }, to: { x: 78, y: 25 }, type: 'dribble' }
          ]
        },
        {
          stepNumber: 2,
          title: 'Krok 2: Zasłona Hammer & Skip Pass',
          description: '(4) stawia zasłonę Hammer dla (3) w lewym rogu. (2) posyła podanie wzdłuż linii końcowej do wolnego (3).',
          tokens: [
            { id: 'O1', label: '1', role: 'PG', x: 80, y: 75, isOffense: true },
            { id: 'O2', label: '2', role: 'SG', x: 78, y: 20, isOffense: true },
            { id: 'O3', label: '3', role: 'SF', x: 10, y: 18, isOffense: true },
            { id: 'O4', label: '4', role: 'PF', x: 18, y: 30, isOffense: true },
            { id: 'O5', label: '5', role: 'C', x: 50, y: 30, isOffense: true },
            { id: 'D1', label: 'D1', x: 80, y: 70, isOffense: false },
            { id: 'D2', label: 'D2', x: 75, y: 25, isOffense: false },
            { id: 'D3', label: 'D3', x: 22, y: 32, isOffense: false },
            { id: 'D4', label: 'D4', x: 20, y: 28, isOffense: false },
            { id: 'D5', label: 'D5', x: 55, y: 28, isOffense: false },
            { id: 'BALL', label: '🏀', x: 10, y: 18, isOffense: true, isBall: true }
          ],
          strokes: [
            { id: 'h3', from: { x: 20, y: 35 }, to: { x: 18, y: 30 }, type: 'screen' },
            { id: 'h4', from: { x: 25, y: 70 }, to: { x: 10, y: 18 }, type: 'cut' },
            { id: 'h5', from: { x: 78, y: 20 }, to: { x: 10, y: 18 }, type: 'pass' }
          ]
        }
      ],
      coachingKeys: [
        'Wjazd musi być agresywny, by zmusić pomoc ze strony słabej',
        'Zasłona Hammer musi odciąć obrońcę w rogu boiska',
        'Podanie z linii końcowej wymaga precyzji i siły'
      ]
    }
  },
  {
    name: 'Elevator Doors ATO (Zasłona Windowa)',
    category: 'ato',
    targetDefense: 'Obrona każdy swego (Po czasie / Clutch)',
    description: 'Zagrywka po przerwie na żądanie (After Time Out). Strzelec przebiega między dwoma wysokimi, którzy zamykają za nim drzwi (Elevator Screen).',
    tags: ['ATO', 'Elevator Screen', 'Clutch', 'Warriors Action'],
    diagramData: {
      tokens: [
        { id: 'O1', label: '1', role: 'PG', x: 25, y: 75, isOffense: true },
        { id: 'O2', label: '2', role: 'SG', x: 50, y: 20, isOffense: true },
        { id: 'O3', label: '3', role: 'SF', x: 80, y: 70, isOffense: true },
        { id: 'O4', label: '4', role: 'PF', x: 42, y: 60, isOffense: true },
        { id: 'O5', label: '5', role: 'C', x: 58, y: 60, isOffense: true },
        { id: 'D1', label: 'D1', x: 28, y: 70, isOffense: false },
        { id: 'D2', label: 'D2', x: 50, y: 26, isOffense: false },
        { id: 'D3', label: 'D3', x: 78, y: 65, isOffense: false },
        { id: 'D4', label: 'D4', x: 42, y: 55, isOffense: false },
        { id: 'D5', label: 'D5', x: 58, y: 55, isOffense: false },
        { id: 'BALL', label: '🏀', x: 25, y: 75, isOffense: true, isBall: true }
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Krok 1: Bieg Strzelca Przez Windę',
          description: 'Strzelec (2) wykonuje dynamiczny sprint spod kosza prosto na szczyt między (4) i (5).',
          tokens: [
            { id: 'O1', label: '1', role: 'PG', x: 25, y: 75, isOffense: true },
            { id: 'O2', label: '2', role: 'SG', x: 50, y: 75, isOffense: true },
            { id: 'O3', label: '3', role: 'SF', x: 85, y: 65, isOffense: true },
            { id: 'O4', label: '4', role: 'PF', x: 47, y: 65, isOffense: true },
            { id: 'O5', label: '5', role: 'C', x: 53, y: 65, isOffense: true },
            { id: 'D1', label: 'D1', x: 28, y: 70, isOffense: false },
            { id: 'D2', label: 'D2', x: 50, y: 58, isOffense: false },
            { id: 'D3', label: 'D3', x: 80, y: 60, isOffense: false },
            { id: 'D4', label: 'D4', x: 42, y: 62, isOffense: false },
            { id: 'D5', label: 'D5', x: 58, y: 62, isOffense: false },
            { id: 'BALL', label: '🏀', x: 25, y: 75, isOffense: true, isBall: true }
          ],
          strokes: [
            { id: 'e1', from: { x: 50, y: 20 }, to: { x: 50, y: 75 }, type: 'cut' },
            { id: 'e2', from: { x: 42, y: 60 }, to: { x: 47, y: 65 }, type: 'screen' },
            { id: 'e3', from: { x: 58, y: 60 }, to: { x: 53, y: 65 }, type: 'screen' }
          ]
        },
        {
          stepNumber: 2,
          title: 'Krok 2: Zamknięcie Drzwi & Rzut za 3',
          description: '(4) i (5) zwierają ramiona blokując obrońcę (D2). (1) podaje do (2) na szczyt na czysty rzut.',
          tokens: [
            { id: 'O1', label: '1', role: 'PG', x: 25, y: 75, isOffense: true },
            { id: 'O2', label: '2', role: 'SG', x: 50, y: 78, isOffense: true },
            { id: 'O3', label: '3', role: 'SF', x: 85, y: 65, isOffense: true },
            { id: 'O4', label: '4', role: 'PF', x: 48, y: 68, isOffense: true },
            { id: 'O5', label: '5', role: 'C', x: 52, y: 68, isOffense: true },
            { id: 'D1', label: 'D1', x: 28, y: 70, isOffense: false },
            { id: 'D2', label: 'D2', x: 50, y: 60, isOffense: false },
            { id: 'D3', label: 'D3', x: 80, y: 60, isOffense: false },
            { id: 'D4', label: 'D4', x: 42, y: 65, isOffense: false },
            { id: 'D5', label: 'D5', x: 58, y: 65, isOffense: false },
            { id: 'BALL', label: '🏀', x: 50, y: 78, isOffense: true, isBall: true }
          ],
          strokes: [
            { id: 'e4', from: { x: 25, y: 75 }, to: { x: 50, y: 78 }, type: 'pass' }
          ]
        }
      ],
      coachingKeys: [
        'Zasłaniający muszą zamknąć przestrzeń w ułamku sekundy po przebiegnięciu strzelca',
        'Podanie musi być natychmiastowe (Catch & Shoot bez kozła)',
        'Timing jest kluczem — bieg nie może zacząć się za wcześnie'
      ]
    }
  }
];
