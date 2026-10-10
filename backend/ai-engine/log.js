// Technical log of AI calls (AiGenerationLog): who asked which engine, what actually ran, timing, tokens, cost.
// Prompts, answers and personal data are never written here. Logging never breaks a generation.
import crypto from 'node:crypto';

const KEY_PATTERNS = [/sk-ant-[\w-]+/g, /AIza[\w-]{10,}/g, /sk-[\w-]{16,}/g, /Bearer\s+[\w.-]+/gi];

export function sanitizeError(message) {
  if (!message) return null;
  let text = String(message);
  for (const pattern of KEY_PATTERNS) text = text.replace(pattern, '[ukryto]');
  return text.slice(0, 300);
}

export const newRequestId = () => crypto.randomUUID();

/**
 * @param {*} db Prisma client (or a test double); missing table or DB errors are swallowed.
 * @param {{ requestId?: string, operation: string, source: 'panel'|'studio'|'mcp', requestedEngine: string, actualEngine: string,
 *   model?: string|null, status: 'ok'|'error'|'rejected'|'uncertain', errorCode?: string|null, error?: string|null,
 *   startedAt: Date, finishedAt?: Date, inputTokens?: number, outputTokens?: number, costMicros?: number|null, costKind?: string }} entry
 */
export async function logGeneration(db, entry) {
  try {
    const finishedAt = entry.finishedAt || new Date();
    await db.aiGenerationLog.create({
      data: {
        requestId: entry.requestId || newRequestId(),
        operation: entry.operation,
        source: entry.source,
        requestedEngine: entry.requestedEngine,
        actualEngine: entry.actualEngine,
        model: entry.model ?? null,
        status: entry.status,
        errorCode: entry.errorCode ?? null,
        error: sanitizeError(entry.error),
        startedAt: entry.startedAt,
        finishedAt,
        durationMs: Math.max(0, finishedAt.getTime() - entry.startedAt.getTime()),
        inputTokens: Number.isFinite(entry.inputTokens) ? Math.round(entry.inputTokens) : null,
        outputTokens: Number.isFinite(entry.outputTokens) ? Math.round(entry.outputTokens) : null,
        costMicros: Number.isFinite(entry.costMicros) ? Math.round(entry.costMicros) : null,
        costKind: entry.costKind || 'none',
      },
    });
  } catch (err) {
    if (err?.code !== 'P2021') console.error('[AI log] zapis nieudany', err?.name || err);
  }
}
