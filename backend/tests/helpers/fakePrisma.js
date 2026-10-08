/**
 * Minimalny Prisma w pamięci do testów importu KALK v2 (bez bazy danych).
 * Obsługuje: findUnique/findFirst/findMany/count/create/createMany/update/updateMany/
 * upsert/delete/deleteMany, $transaction, filtry (equals, in, notIn, not, gte/lte/gt/lt,
 * contains+mode, OR/AND/NOT), klucze złożone (`seasonId_id: {…}`), select, orderBy, take
 * oraz include { kalkPlayer } dla rosterPlayer.
 */
import { randomUUID } from 'crypto';

const MODELS = [
  'kalkSeason', 'kalkTeam', 'kalkTeamProfile', 'leagueTeam', 'leagueMatch', 'kalkPlayerProfile',
  'kalkPlayer', 'kalkMatch', 'kalkTeamGameStat', 'kalkPlayerGameLog', 'kalkPlayByPlayEvent',
  'kalkPlayerSeasonStat', 'kalkMatchIdAlias', 'kalkSyncRun', 'rosterPlayer', 'game',
  'playerSeasonPreference'
];
const AUTO_ID = new Set(['leagueMatch', 'kalkPlayerGameLog', 'rosterPlayer', 'kalkSyncRun', 'game']);
const RELATIONS = {
  rosterPlayer: { kalkPlayer: { model: 'kalkPlayer', local: 'kalkPlayerId', foreign: 'id' } }
};
const OPERATORS = new Set(['equals', 'in', 'notIn', 'not', 'gt', 'gte', 'lt', 'lte', 'contains', 'mode', 'startsWith']);

const clone = (v) => (v === undefined ? v : structuredClone(v));
const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);
const cmp = (a, b) => (a instanceof Date ? a.getTime() : a) - (b instanceof Date ? b.getTime() : b);
const eq = (a, b) => {
  if (a instanceof Date || b instanceof Date) return a != null && b != null && new Date(a).getTime() === new Date(b).getTime();
  return (a ?? null) === (b ?? null);
};

function matchField(value, cond) {
  if (!isPlainObject(cond)) return eq(value, cond);
  const keys = Object.keys(cond);
  if (!keys.every((k) => OPERATORS.has(k))) return false;
  for (const [op, arg] of Object.entries(cond)) {
    if (op === 'equals' && !eq(value, arg)) return false;
    if (op === 'in' && !arg.some((x) => eq(value, x))) return false;
    if (op === 'notIn' && arg.some((x) => eq(value, x))) return false;
    if (op === 'not' && (isPlainObject(arg) ? matchField(value, arg) : eq(value, arg))) return false;
    if (op === 'gt' && !(value != null && cmp(value, arg) > 0)) return false;
    if (op === 'gte' && !(value != null && cmp(value, arg) >= 0)) return false;
    if (op === 'lt' && !(value != null && cmp(value, arg) < 0)) return false;
    if (op === 'lte' && !(value != null && cmp(value, arg) <= 0)) return false;
    if (op === 'startsWith' && !(typeof value === 'string' && value.startsWith(arg))) return false;
    if (op === 'contains') {
      if (typeof value !== 'string') return false;
      const ci = cond.mode === 'insensitive';
      if (!(ci ? value.toLowerCase().includes(String(arg).toLowerCase()) : value.includes(arg))) return false;
    }
  }
  return true;
}

function matches(row, where) {
  if (!where) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (cond === undefined) continue;
    if (key === 'OR') {
      if (!cond.some((w) => matches(row, w))) return false;
    } else if (key === 'AND') {
      if (!(Array.isArray(cond) ? cond : [cond]).every((w) => matches(row, w))) return false;
    } else if (key === 'NOT') {
      if ((Array.isArray(cond) ? cond : [cond]).some((w) => matches(row, w))) return false;
    } else if (isPlainObject(cond) && !(key in row) && !Object.keys(cond).every((k) => OPERATORS.has(k))) {
      // klucz złożony, np. seasonId_id: { seasonId, id }
      if (!matches(row, cond)) return false;
    } else if (!matchField(row[key], cond)) {
      return false;
    }
  }
  return true;
}

function project(row, select) {
  if (!select) return clone(row);
  const out = {};
  for (const [k, v] of Object.entries(select)) if (v) out[k] = clone(row[k]);
  return out;
}

export function createFakePrisma(seed = {}) {
  const tables = Object.fromEntries(MODELS.map((m) => [m, (seed[m] || []).map(clone)]));
  const writes = [];
  const client = {};

  const withIncludes = (model, row, include) => {
    const out = clone(row);
    for (const [rel, on] of Object.entries(include || {})) {
      const r = RELATIONS[model]?.[rel];
      if (!on || !r) continue;
      out[rel] = clone(tables[r.model].find((x) => eq(x[r.foreign], row[r.local])) || null);
    }
    return out;
  };

  const sortRows = (rows, orderBy) => {
    const orders = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [];
    return [...rows].sort((a, b) => {
      for (const o of orders) {
        const [k, dir] = Object.entries(o)[0];
        const av = a[k];
        const bv = b[k];
        if (av == null && bv == null) continue;
        if (av == null) return 1;
        if (bv == null) return -1;
        const c = typeof av === 'string' ? av.localeCompare(bv) : cmp(av, bv);
        if (c) return dir === 'desc' ? -c : c;
      }
      return 0;
    });
  };

  const record = (model, op, n = 1) => writes.push({ model, op, n });

  for (const model of MODELS) {
    const t = () => tables[model];
    const create = (data) => {
      const row = { ...clone(data) };
      if (AUTO_ID.has(model) && !row.id) row.id = randomUUID();
      if (model === 'kalkMatch') row.overtimes ??= 0;
      row.updatedAt = new Date();
      t().push(row);
      return row;
    };
    client[model] = {
      findUnique: async ({ where, select, include } = {}) => {
        const row = t().find((r) => matches(r, where));
        if (!row) return null;
        return select ? project(row, select) : withIncludes(model, row, include);
      },
      findFirst: async ({ where, select, include, orderBy } = {}) => {
        const row = sortRows(t().filter((r) => matches(r, where)), orderBy)[0];
        if (!row) return null;
        return select ? project(row, select) : withIncludes(model, row, include);
      },
      findMany: async ({ where, select, include, orderBy, take } = {}) => {
        let rows = sortRows(t().filter((r) => matches(r, where)), orderBy);
        if (take != null) rows = rows.slice(0, take);
        return rows.map((r) => (select ? project(r, select) : withIncludes(model, r, include)));
      },
      count: async ({ where } = {}) => t().filter((r) => matches(r, where)).length,
      create: async ({ data }) => {
        record(model, 'create');
        return clone(create(data));
      },
      createMany: async ({ data }) => {
        record(model, 'createMany', data.length);
        data.forEach(create);
        return { count: data.length };
      },
      update: async ({ where, data }) => {
        const row = t().find((r) => matches(r, where));
        if (!row) throw new Error(`fakePrisma ${model}.update: brak rekordu ${JSON.stringify(where)}`);
        record(model, 'update');
        Object.assign(row, clone(data), { updatedAt: new Date() });
        return clone(row);
      },
      updateMany: async ({ where, data }) => {
        const rows = t().filter((r) => matches(r, where));
        record(model, 'updateMany', rows.length);
        rows.forEach((r) => Object.assign(r, clone(data)));
        return { count: rows.length };
      },
      upsert: async ({ where, create: createData, update }) => {
        const row = t().find((r) => matches(r, where));
        record(model, 'upsert');
        if (row) {
          Object.assign(row, clone(update), { updatedAt: new Date() });
          return clone(row);
        }
        return clone(create(createData));
      },
      delete: async ({ where }) => {
        const idx = t().findIndex((r) => matches(r, where));
        if (idx === -1) throw new Error(`fakePrisma ${model}.delete: brak rekordu`);
        record(model, 'delete');
        return t().splice(idx, 1)[0];
      },
      deleteMany: async ({ where } = {}) => {
        const keep = t().filter((r) => !matches(r, where));
        const n = t().length - keep.length;
        if (n) record(model, 'deleteMany', n);
        tables[model] = keep;
        return { count: n };
      }
    };
  }

  client.$transaction = async (arg) => (typeof arg === 'function' ? arg(client) : Promise.all(arg));
  client.$disconnect = async () => {};
  client.$tables = tables;
  client.$writes = writes;
  client.$resetWrites = () => {
    writes.length = 0;
  };
  return client;
}
