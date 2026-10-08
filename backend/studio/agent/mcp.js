// MCP endpoint for external agents (Claude, Cursor…): read facts and playbooks, draft copy.
// Agents never confirm facts, approve, publish, download packages or change settings — the owner does, in Studio.
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z, ZodError } from 'zod';
import { ownerId } from '../config.js';
import { channelIds, channels } from '../publications/channels.js';
import { playbook, playbooks } from '../publications/playbooks.js';
import { brandVoice, channelInstructions, PROMPT_VERSION } from '../publications/prompts.js';
import { schematicCopy } from '../publications/templates.js';
import { createPublication, getSettings, listPublications, publicationView, updateItem } from '../publications/service.js';
import { allowRequest, authenticateAgent } from './tokens.js';

const json = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
const uuid = z.string().uuid();
const channelEnum = { type: 'string', enum: channelIds };

// Compact, agent-oriented view: what is confirmed, what each channel says and what still blocks it.
function agentView(p) {
  return {
    id: p.id,
    title: p.title,
    playbook: p.playbook,
    schema: p.playbookDef && { label: p.playbookDef.label, timing: p.playbookDef.timing, mustSay: p.playbookDef.hint },
    status: p.status,
    plannedAt: p.plannedAt,
    factsConfirmed: p.factsConfirmed,
    facts: p.facts,
    revision: p.revision,
    channels: p.items.map((i) => ({
      channel: i.channel,
      status: i.status,
      editableByAgent: i.status === 'draft',
      copy: i.copy,
      copyOrigin: i.copyOrigin,
      lint: i.issues,
      blockers: i.ready,
      plannedAt: i.plannedAt,
    })),
  };
}

export const tools = [
  {
    name: 'list_playbooks',
    description: 'Lista schematów publikacji BeKaPaKa: kanały, termin, wymagane fakty i co musi paść w tekście.',
    inputSchema: { type: 'object', properties: {} },
    scope: 'read',
    run: async () =>
      json(playbooks.map((p) => ({ id: p.id, category: p.category, label: p.label, timing: p.timing, channels: Object.keys(p.items), requiredFacts: p.required, mustSay: p.hint }))),
  },
  {
    name: 'get_prompts',
    description: 'Zasady marki i instrukcje kanałów obowiązujące przy pisaniu tekstów (ta sama wersja, której używa Studio).',
    inputSchema: { type: 'object', properties: {} },
    scope: 'read',
    run: async (_db, _owner) => json({ version: PROMPT_VERSION, brandVoice, channelInstructions, limits: Object.fromEntries(channelIds.map((c) => [c, channels[c].limits])) }),
  },
  {
    name: 'list_publications',
    description: 'Publikacje w Studio (robocze albo archiwum) ze statusami kanałów.',
    inputSchema: { type: 'object', properties: { status: { type: 'string', enum: ['draft', 'archived'] } } },
    scope: 'read',
    run: async (db, owner, args) =>
      json(
        (await listPublications(db, owner, { status: args.status || 'draft' })).map((p) => ({
          id: p.id,
          title: p.title,
          playbook: p.playbook,
          plannedAt: p.plannedAt,
          factsConfirmed: p.factsConfirmed,
          channels: p.items.map((i) => ({ channel: i.channel, status: i.status })),
        })),
      ),
  },
  {
    name: 'get_publication',
    description: 'Fakty, teksty kanałów, wyniki kontroli marki i blokady jednej publikacji. Pisz wyłącznie na podstawie pola facts.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    scope: 'read',
    run: async (db, owner, args) => json(agentView(await publicationView(db, owner, uuid.parse(args.id)))),
  },
  {
    name: 'schematic_copy',
    description: 'Deterministyczny szkic tekstu ze schematu dla aktualnych faktów (bez zapisu). Dobry punkt wyjścia do redakcji.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    scope: 'read',
    run: async (db, owner, args) => {
      const p = await publicationView(db, owner, uuid.parse(args.id));
      return json(schematicCopy(playbook(p.playbook), p.facts, await getSettings(db, owner)));
    },
  },
  {
    name: 'create_publication',
    description:
      'Tworzy roboczą publikację ze schematu. Fakty z meczu KALK (source) albo ręczne (facts). Fakty wymagają potwierdzenia przez właściciela w Studio.',
    inputSchema: {
      type: 'object',
      properties: {
        playbook: { type: 'string', description: 'id schematu z list_playbooks' },
        source: { type: 'object', properties: { kind: { const: 'match' }, id: { type: 'string' }, seasonId: { type: 'string' } } },
        facts: { type: 'object', description: 'Fakty publiczne (title, opponent, date ISO, venue, person, partner, notes…)' },
        channels: { type: 'array', items: channelEnum },
      },
      required: ['playbook'],
    },
    scope: 'draft',
    run: async (db, owner, args) => {
      const id = await createPublication(db, owner, args);
      return json(agentView(await publicationView(db, owner, id)));
    },
  },
  {
    name: 'propose_copy',
    description:
      'Zapisuje propozycję tekstu jednego kanału (tylko kanał w stanie roboczym). Zwraca wynik kontroli marki. Zatwierdza wyłącznie właściciel.',
    inputSchema: {
      type: 'object',
      properties: {
        publicationId: { type: 'string' },
        channel: channelEnum,
        copy: { type: 'object', description: 'Pola zgodne z kanałem — patrz get_prompts' },
      },
      required: ['publicationId', 'channel', 'copy'],
    },
    scope: 'draft',
    run: async (db, owner, args) => {
      const p = await publicationView(db, owner, uuid.parse(args.publicationId));
      const item = p.items.find((i) => i.channel === args.channel);
      if (!item) return { isError: true, ...json({ error: 'Ta publikacja nie ma takiego kanału' }) };
      if (item.status !== 'draft') return { isError: true, ...json({ error: `Kanał ma status „${item.status}” — agent może zmieniać tylko robocze teksty` }) };
      const view = await updateItem(db, owner, p.id, item.id, { expectedRevision: item.revision, copy: args.copy, copyOrigin: 'agent', promptVersion: `agent:${PROMPT_VERSION}` }, 'agent');
      const saved = view.items.find((i) => i.id === item.id);
      return json({ saved: true, channel: saved.channel, lint: saved.issues, blockers: saved.ready });
    },
  },
];

function buildServer(db, agent) {
  const server = new Server({ name: 'bekapaka-studio', version: PROMPT_VERSION }, { capabilities: { tools: {} } });
  const allowed = tools.filter((t) => agent.scopes.includes(t.scope));
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allowed.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
  }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = allowed.find((t) => t.name === request.params.name);
    if (!tool) return { isError: true, ...json({ error: 'Nieznane narzędzie albo brak uprawnień tokenu' }) };
    try {
      return await tool.run(db, agent.ownerId, request.params.arguments || {});
    } catch (err) {
      const message = err instanceof ZodError ? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') : err.status ? err.message : 'Operacja nie powiodła się';
      if (!err.status && !(err instanceof ZodError)) console.error('Studio MCP tool failed', tool.name, err.name);
      return { isError: true, ...json({ error: message, ...(err.details ? { details: err.details } : {}) }) };
    }
  });
  return server;
}

/** Mounted before the cookie/CSRF middleware: agents authenticate with a Bearer token only. */
export function mcpRoutes(router, db) {
  router.all('/mcp', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!ownerId()) return res.status(503).json({ error: 'Studio czeka na konfigurację właściciela' });
    const agent = await authenticateAgent(db, req.get('Authorization'));
    if (!agent) return res.status(401).set('WWW-Authenticate', 'Bearer').json({ error: 'Nieprawidłowy lub odwołany token agenta' });
    if (!allowRequest(agent.id)) return res.status(429).json({ error: 'Za dużo żądań agenta. Spróbuj za minutę.' });
    // Stateless Streamable HTTP: one JSON-RPC exchange per POST, no server-sent sessions.
    if (req.method !== 'POST') return res.status(405).set('Allow', 'POST').json({ error: 'Użyj POST (Streamable HTTP, bez sesji)' });
    const server = buildServer(db, agent);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });
}
