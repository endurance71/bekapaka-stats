// Owner's AI choices: a model per Studio task and custom text models with owner-entered prices.
import { z } from 'zod';
import { fail } from '../config.js';
import { allModels, findModel, models, providerIds, reservationFor, reservationMicros, SDK_ENGINE, taskIds, tasks } from './catalog.js';
import { keyStatus } from './secrets.js';
import { getEngineSetting } from '../../ai-engine/settings.js';
import { isAgentSdkConfigured } from '../../ai-engine/agentSdk.js';

const KEY = 'ai';
const customModelSchema = z
  .object({
    id: z.string().trim().regex(/^[a-z0-9][a-z0-9._:-]{1,79}$/i, 'Identyfikator modelu: litery, cyfry, kropki i myślniki'),
    provider: z.enum(providerIds),
    label: z.string().trim().min(1).max(60),
    input: z.number().positive().max(200),
    output: z.number().positive().max(500),
  })
  .strict();
const settingsSchema = z
  .object({
    tasks: z.partialRecord(z.enum(taskIds), z.string().max(80)).default({}),
    customModels: z.array(customModelSchema).max(20).default([]),
  })
  .strict();

export async function aiSettings(db, owner) {
  const row = await db.studioSetting.findUnique({ where: { ownerId_key: { ownerId: owner, key: KEY } } });
  return settingsSchema.parse(row?.value ?? {});
}
async function save(db, owner, value) {
  await db.studioSetting.upsert({ where: { ownerId_key: { ownerId: owner, key: KEY } }, create: { ownerId: owner, key: KEY, value }, update: { value } });
}

/** Model for a task: the owner's choice, else the server default (env), else the catalog default. */
export function modelFor(settings, taskId) {
  const envDefault = { copy: process.env.STUDIO_AI_TEXT_MODEL, text: process.env.STUDIO_AI_TEXT_MODEL, image: process.env.STUDIO_AI_IMAGE_MODEL }[taskId];
  for (const id of [settings.tasks[taskId], envDefault, tasks[taskId].default]) {
    const model = id && findModel(id, settings.customModels);
    if (model && model.kind === tasks[taskId].kind) return model;
  }
  fail(500, 'Brak modelu dla zadania AI');
}

export async function setTaskModel(db, owner, input) {
  const data = z.object({ task: z.enum(taskIds), model: z.string().max(80) }).strict().parse(input);
  const settings = await aiSettings(db, owner);
  const model = findModel(data.model, settings.customModels);
  if (!model || model.kind !== tasks[data.task].kind) fail(422, 'Ten model nie obsługuje tego zadania');
  await save(db, owner, { ...settings, tasks: { ...settings.tasks, [data.task]: model.id } });
}

export async function addCustomModel(db, owner, input) {
  const model = customModelSchema.parse(input);
  const settings = await aiSettings(db, owner);
  if (models.some((m) => m.id === model.id)) fail(409, 'Ten model jest już na liście Studio');
  await save(db, owner, { ...settings, customModels: [...settings.customModels.filter((m) => m.id !== model.id), model] });
}
export async function removeCustomModel(db, owner, id) {
  const settings = await aiSettings(db, owner);
  const tasksLeft = Object.fromEntries(Object.entries(settings.tasks).filter(([, m]) => m !== id));
  await save(db, owner, { tasks: tasksLeft, customModels: settings.customModels.filter((m) => m.id !== id) });
}

/** Everything the Settings page needs: keys (status only), models with prices, task choices and per-call ceilings. */
export async function aiOverview(db, owner) {
  const settings = await aiSettings(db, owner);
  const keys = await keyStatus(db, owner);
  const engine = await getEngineSetting(db);
  const hasKey = (provider) => !!keys.find((k) => k.provider === provider)?.source;
  return {
    keys,
    models: allModels(settings.customModels).map((m) => ({
      ...m,
      available: hasKey(m.provider),
      maxCallMicros: Object.fromEntries(taskIds.filter((t) => tasks[t].kind === m.kind).map((t) => [t, reservationMicros(m, t)])),
    })),
    // Text tasks follow the global engine switch; under the Claude Agent SDK they all use its model and server key.
    engine: engine.engine,
    tasks: taskIds.map((id) => {
      // `apiModel` is the owner's per-task choice for the API engine (kept and editable while the SDK is active).
      const apiModel = modelFor(settings, id);
      if (engine.engine === SDK_ENGINE && tasks[id].kind === 'text') {
        const model = { ...findModel(engine.agentSdkModel), engine: SDK_ENGINE };
        return { id, label: tasks[id].label, kind: tasks[id].kind, model: model.id, apiModel: apiModel.id, engine: SDK_ENGINE, available: isAgentSdkConfigured(), maxCallMicros: reservationFor(model, id) };
      }
      return { id, label: tasks[id].label, kind: tasks[id].kind, model: apiModel.id, apiModel: apiModel.id, engine: 'api', available: hasKey(apiModel.provider), maxCallMicros: reservationMicros(apiModel, id) };
    }),
    customModels: settings.customModels,
  };
}
