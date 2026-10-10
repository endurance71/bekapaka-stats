// The one global text-engine choice shared by the panel and Studio. Stored in AiEngineSetting; every change is audited.
// Read with a short cache so a change applies to new generations within seconds, without a redeploy.
import { z } from 'zod';
import { models } from '../studio/providers/catalog.js';

export const ENGINES = ['api', 'claude-agent-sdk'];
// SDK models must have catalog prices: Studio reserves the worst case of every call in its monthly budget.
export const SDK_MODEL_IDS = models.filter((m) => m.provider === 'anthropic' && m.kind === 'text').map((m) => m.id);
export const DEFAULT_SDK_MODEL = SDK_MODEL_IDS.includes('claude-sonnet-5-5') ? 'claude-sonnet-5-5' : SDK_MODEL_IDS[0];
export const DEFAULTS = Object.freeze({ engine: 'api', agentSdkModel: DEFAULT_SDK_MODEL, fallbackToApi: false, updatedAt: null, updatedBy: null, updatedFrom: null });

const TTL_MS = 5_000;
let cache = null;
export function clearEngineCache() {
  cache = null;
}

const inputSchema = z
  .object({
    engine: z.enum(ENGINES),
    agentSdkModel: z.enum(SDK_MODEL_IDS).optional(),
    fallbackToApi: z.boolean().optional(),
  })
  .strict();

function normalize(row) {
  if (!row) return { ...DEFAULTS };
  return {
    engine: ENGINES.includes(row.engine) ? row.engine : 'api',
    agentSdkModel: SDK_MODEL_IDS.includes(row.agentSdkModel) ? row.agentSdkModel : DEFAULT_SDK_MODEL,
    fallbackToApi: !!row.fallbackToApi,
    updatedAt: row.updatedAt ?? null,
    updatedBy: row.updatedBy ?? null,
    updatedFrom: row.updatedFrom ?? null,
  };
}

/** Current setting. A missing table (backend not migrated yet) means the unchanged default: the existing API. */
export async function getEngineSetting(db, { fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let row = null;
  try {
    row = db.aiEngineSetting ? await db.aiEngineSetting.findUnique({ where: { id: 'global' } }) : null;
  } catch (err) {
    if (err?.code !== 'P2021') throw err;
  }
  const value = normalize(row);
  cache = { at: Date.now(), value };
  return value;
}

/** Saves the choice and an audit row in one transaction. `from` is 'panel' or 'studio'. */
export async function setEngineSetting(db, input, { actorId, from }) {
  const data = inputSchema.parse(input);
  const result = await db.$transaction(async (tx) => {
    const before = normalize(await tx.aiEngineSetting.findUnique({ where: { id: 'global' } }));
    const next = {
      engine: data.engine,
      agentSdkModel: data.agentSdkModel ?? before.agentSdkModel,
      fallbackToApi: data.fallbackToApi ?? before.fallbackToApi,
      updatedBy: String(actorId),
      updatedFrom: from,
    };
    const row = await tx.aiEngineSetting.upsert({ where: { id: 'global' }, create: { id: 'global', ...next }, update: next });
    const pick = (s) => ({ engine: s.engine, agentSdkModel: s.agentSdkModel, fallbackToApi: s.fallbackToApi });
    await tx.aiSettingAudit.create({ data: { actorId: String(actorId), from, before: pick(before), after: pick(next) } });
    return normalize(row);
  });
  clearEngineCache();
  return result;
}

/** Recent changes for the settings screens (no secrets are ever part of the setting). */
export async function engineAudit(db, take = 5) {
  try {
    return await db.aiSettingAudit.findMany({ orderBy: { createdAt: 'desc' }, take });
  } catch (err) {
    if (err?.code === 'P2021') return [];
    throw err;
  }
}
