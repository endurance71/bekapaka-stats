/**
 * Proxy Prisma dla `--dry-run`: odczyty idą do bazy, zapisy są tylko liczone.
 */
const WRITE_OPS = new Set(['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']);

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {{ client: any, writes: Record<string, number> }}
 */
export function createDryRunPrisma(prisma) {
  const writes = {};
  const delegates = new Map();

  const wrapDelegate = (name, delegate) =>
    new Proxy(delegate, {
      get(target, op) {
        if (typeof op === 'string' && WRITE_OPS.has(op)) {
          return async (args = {}) => {
            const key = `${name}.${op}`;
            writes[key] = (writes[key] || 0) + 1;
            if (op === 'createMany' || op === 'updateMany' || op === 'deleteMany') return { count: 0 };
            return { ...(args.create || {}), ...(args.data || {}) };
          };
        }
        const value = target[op];
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });

  const client = new Proxy(prisma, {
    get(target, prop) {
      if (prop === '$transaction') {
        return async (arg) => (typeof arg === 'function' ? arg(client) : Promise.all(arg));
      }
      const value = target[prop];
      if (typeof prop === 'string' && !prop.startsWith('$') && value && typeof value === 'object') {
        if (!delegates.has(prop)) delegates.set(prop, wrapDelegate(prop, value));
        return delegates.get(prop);
      }
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });

  return { client, writes };
}
