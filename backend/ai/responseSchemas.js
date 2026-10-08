/**
 * JSON Schema dla odpowiedzi Gemini (config.responseJsonSchema) — wymusza strukturę JSON
 * dla planu zawodnika, scoutingu, odprawy i generatora zagrywek.
 */

const str = { type: 'string' };

export const PLAYER_DEVELOPMENT_SCHEMA = {
  type: 'object',
  properties: {
    profile: str,
    positionPriorities: str,
    strengths: str,
    improvements: str,
    trainingProposals: str,
    trend: str,
    sessionFocus: str,
    seasonGoals: str
  },
  required: [
    'profile',
    'positionPriorities',
    'strengths',
    'improvements',
    'trainingProposals',
    'trend',
    'sessionFocus',
    'seasonGoals'
  ]
};

export const SCOUTING_SCHEMA = {
  type: 'object',
  properties: {
    summary: str,
    offense: str,
    defense: str,
    verdict: str,
    personnel: {
      type: 'object',
      properties: {
        keyPlayers: str,
        threats: str,
        matchups: str,
        bench: str
      },
      required: ['keyPlayers', 'threats', 'matchups', 'bench']
    },
    lockerRoom: { type: 'array', items: str, minItems: 3, maxItems: 5 }
  },
  required: ['summary', 'offense', 'defense', 'verdict', 'personnel', 'lockerRoom']
};

export const PREGAME_CARD_SCHEMA = {
  type: 'object',
  properties: {
    tacticalKeys: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          number: { type: 'integer' },
          title: str,
          description: str,
          focus: { type: 'string', enum: ['defense', 'offense', 'transition'] }
        },
        required: ['number', 'title', 'description', 'focus']
      }
    },
    startingFive: {
      type: 'array',
      minItems: 5,
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          position: str,
          playerId: str,
          name: str,
          number: { type: ['integer', 'null'] },
          assignment: str
        },
        required: ['position', 'playerId', 'name', 'assignment']
      }
    },
    benchKeys: str,
    motivationalMotto: str
  },
  required: ['tacticalKeys', 'startingFive', 'benchKeys', 'motivationalMotto']
};

const keyframe = {
  type: 'object',
  properties: {
    time: { type: 'number' },
    x: { type: 'number' },
    y: { type: 'number' },
    heading: { type: 'number' },
    action: str
  },
  required: ['time', 'x', 'y', 'action']
};

export const TACTICAL_PLAY_SCHEMA = {
  type: 'object',
  properties: {
    name: str,
    category: { type: 'string', enum: ['half_court', 'blob', 'slob', 'ato', 'fastbreak', 'defense'] },
    targetDefense: str,
    description: str,
    diagramData: {
      type: 'object',
      properties: {
        duration: { type: 'number' },
        coachingKeys: { type: 'array', items: str },
        phaseDirectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              startTime: { type: 'number' },
              endTime: { type: 'number' },
              title: str,
              description: str,
              coachingCues: { type: 'array', items: str }
            },
            required: ['startTime', 'endTime', 'title', 'description']
          }
        },
        players: {
          type: 'array',
          minItems: 10,
          maxItems: 10,
          items: {
            type: 'object',
            properties: {
              id: str,
              number: { type: 'integer' },
              name: str,
              role: str,
              isOffense: { type: 'boolean' },
              keyframes: { type: 'array', minItems: 2, items: keyframe }
            },
            required: ['id', 'role', 'isOffense', 'keyframes']
          }
        },
        ball: {
          type: 'object',
          properties: {
            keyframes: {
              type: 'array',
              minItems: 2,
              items: {
                type: 'object',
                properties: {
                  time: { type: 'number' },
                  x: { type: 'number' },
                  y: { type: 'number' },
                  holderId: { type: ['string', 'null'] },
                  isPass: { type: 'boolean' },
                  isShot: { type: 'boolean' },
                  arcHeight: { type: 'number' }
                },
                required: ['time', 'x', 'y']
              }
            }
          },
          required: ['keyframes']
        }
      },
      required: ['duration', 'phaseDirectives', 'players', 'ball']
    }
  },
  required: ['name', 'category', 'description', 'diagramData']
};

/**
 * Lekka walidacja diagramu zagrywki AI (audyt + po generacji): 10 graczy, czasy w [0, duration],
 * współrzędne w [0, 100], piłka z klatkami.
 * @param {unknown} diagram
 * @returns {string[]} lista problemów (pusta = OK)
 */
export function validatePlayDiagram(diagram) {
  const issues = [];
  if (!diagram || typeof diagram !== 'object') return ['brak diagramData'];
  const d = /** @type {Record<string, any>} */ (diagram);
  const duration = Number(d.duration);
  if (!Number.isFinite(duration) || duration <= 0) issues.push('nieprawidłowe duration');
  const players = Array.isArray(d.players) ? d.players : [];
  if (players.length !== 10) issues.push(`liczba graczy ${players.length} (oczekiwano 10)`);
  for (const p of players) {
    const frames = Array.isArray(p?.keyframes) ? p.keyframes : [];
    if (frames.length < 2) issues.push(`${p?.id || '?'}: mniej niż 2 klatki`);
    for (const f of frames) {
      const t = Number(f?.time);
      const x = Number(f?.x);
      const y = Number(f?.y);
      if (!Number.isFinite(t) || (Number.isFinite(duration) && (t < 0 || t > duration + 0.01))) {
        issues.push(`${p?.id || '?'}: klatka poza osią czasu (${f?.time})`);
        break;
      }
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) {
        issues.push(`${p?.id || '?'}: współrzędne poza boiskiem`);
        break;
      }
    }
  }
  const ballFrames = Array.isArray(d.ball?.keyframes) ? d.ball.keyframes : [];
  if (ballFrames.length < 2) issues.push('piłka: mniej niż 2 klatki');
  return issues;
}
