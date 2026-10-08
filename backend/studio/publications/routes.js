import { z } from 'zod';
import { channelIds, channels, itemStatuses, PUBLICATION_VERSION } from './channels.js';
import { playbooks, PLAYBOOK_VERSION } from './playbooks.js';
import { TEMPLATE_VERSION } from './templates.js';
import { LINT_VERSION } from './brand-lint.js';
import { PROMPT_VERSION } from './prompts.js';
import { queueCopy } from '../ai.js';
import { createAgentToken, listAgentTokens, revokeAgentToken } from '../agent/tokens.js';
import { contentSystemDocument } from './document.js';
import { tools as agentTools } from '../agent/mcp.js';
import { origin } from '../config.js';
import { publishWebsite, syncWebsiteDraft, websiteConfigured, websitePreviewUrl } from './website.js';
import {
  applyTemplates,
  approveItem,
  archivePublication,
  confirmFacts,
  refreshFacts,
  createPublication,
  getSettings,
  listPublications,
  markPublished,
  publicationPackage,
  publicationView,
  saveSettings,
  suggestions,
  updateItem,
  updatePublication,
} from './service.js';

const uuid = (v) => z.string().uuid().parse(v);
const revision = z.object({ expectedRevision: z.number().int().min(1) }).strict();

/** Studio 2 publication endpoints; mounted after Studio authentication. */
export function publicationRoutes(router, db) {
  router.get('/playbooks', (_req, res) =>
    res.json({
      versions: { publication: PUBLICATION_VERSION, playbooks: PLAYBOOK_VERSION, templates: TEMPLATE_VERSION, lint: LINT_VERSION, prompts: PROMPT_VERSION },
      channels,
      itemStatuses,
      playbooks,
    }),
  );
  router.get('/publications', async (req, res) => res.json(await listPublications(db, req.studioOwner, req.query)));
  router.get('/publications/suggestions', async (req, res) => res.json(await suggestions(db, req.studioOwner)));
  router.post('/publications', async (req, res) => {
    const id = await createPublication(db, req.studioOwner, req.body);
    res.status(201).json(await publicationView(db, req.studioOwner, id));
  });
  router.get('/publications/:id', async (req, res) => res.json(await publicationView(db, req.studioOwner, uuid(req.params.id))));
  router.put('/publications/:id', async (req, res) => res.json(await updatePublication(db, req.studioOwner, uuid(req.params.id), req.body)));
  router.post('/publications/:id/confirm-facts', async (req, res) =>
    res.json(await confirmFacts(db, req.studioOwner, uuid(req.params.id), revision.parse(req.body).expectedRevision)),
  );
  router.post('/publications/:id/refresh-facts', async (req, res) =>
    res.json(await refreshFacts(db, req.studioOwner, uuid(req.params.id), revision.parse(req.body).expectedRevision)),
  );
  router.post('/publications/:id/templates', async (req, res) => {
    const input = z.object({ channels: z.array(z.enum(channelIds)).min(1) }).strict().parse(req.body);
    res.json(await applyTemplates(db, req.studioOwner, uuid(req.params.id), input.channels));
  });
  router.post('/publications/:id/archive', async (req, res) => {
    const input = z.object({ archived: z.boolean() }).strict().parse(req.body);
    await archivePublication(db, req.studioOwner, uuid(req.params.id), input.archived);
    res.json({ ok: true });
  });
  router.put('/publications/:id/items/:itemId', async (req, res) =>
    res.json(await updateItem(db, req.studioOwner, uuid(req.params.id), uuid(req.params.itemId), req.body)),
  );
  router.post('/publications/:id/items/:itemId/approve', async (req, res) =>
    res.json(await approveItem(db, req.studioOwner, uuid(req.params.id), uuid(req.params.itemId), revision.parse(req.body).expectedRevision)),
  );
  router.post('/publications/:id/items/:itemId/published', async (req, res) =>
    res.json(await markPublished(db, req.studioOwner, uuid(req.params.id), uuid(req.params.itemId), req.body)),
  );
  router.get('/publications/:id/package', async (req, res) => {
    const { name, zip } = await publicationPackage(db, req.studioOwner, uuid(req.params.id));
    res.type('application/zip').attachment(name).send(Buffer.from(zip));
  });
  // AI copy for chosen channels; identical facts and prompt are served from cache without a new charge.
  router.post('/publications/:id/ai-copy', async (req, res) => {
    const input = z.object({ channels: z.array(z.enum(channelIds)).min(1), brief: z.string().trim().max(500).default('') }).strict().parse(req.body);
    const view = await publicationView(db, req.studioOwner, uuid(req.params.id));
    const wanted = input.channels.filter((c) => view.items.some((i) => i.channel === c));
    if (!wanted.length) return res.status(422).json({ error: 'Publikacja nie ma wybranych kanałów' });
    const queued = await queueCopy(db, req.studioOwner, view, wanted, {
      brief: input.brief,
      hashtags: (await getSettings(db, req.studioOwner)).hashtags,
      aiArtwork: view.items.some((i) => i.graphic?.aiAssets),
    });
    if (queued.cached) return res.json({ cached: true, result: queued.result });
    const { leaseToken, payload, ...job } = queued.job;
    res.status(202).json({ cached: false, job });
  });
  router.get('/prompts/document', (_req, res) => {
    const doc = contentSystemDocument({ tools: agentTools, mcpUrl: `${origin()}/api/studio/v1/mcp` });
    res.type('text/markdown; charset=utf-8').attachment('bekapaka-system-tresci.md').send(doc);
  });
  router.get('/agent-tokens', async (req, res) => res.json(await listAgentTokens(db, req.studioOwner)));
  router.post('/agent-tokens', async (req, res) => res.status(201).json(await createAgentToken(db, req.studioOwner, req.body)));
  router.post('/agent-tokens/:id/revoke', async (req, res) => {
    await revokeAgentToken(db, req.studioOwner, req.params.id);
    res.json({ ok: true });
  });
  // Website variant ↔ Strapi news-post: draft, draft-mode preview on bekapaka.pl, publish after approval.
  router.get('/website/config', (_req, res) => res.json(websiteConfigured()));
  router.post('/publications/:id/items/:itemId/website/draft', async (req, res) =>
    res.json(await syncWebsiteDraft(db, req.studioOwner, uuid(req.params.id), uuid(req.params.itemId))),
  );
  router.get('/publications/:id/items/:itemId/website/preview', async (req, res) =>
    res.redirect(302, await websitePreviewUrl(db, req.studioOwner, uuid(req.params.id), uuid(req.params.itemId))),
  );
  router.post('/publications/:id/items/:itemId/website/publish', async (req, res) =>
    res.json(await publishWebsite(db, req.studioOwner, uuid(req.params.id), uuid(req.params.itemId), revision.parse(req.body).expectedRevision)),
  );
  router.get('/settings', async (req, res) => res.json(await getSettings(db, req.studioOwner)));
  router.put('/settings', async (req, res) => res.json(await saveSettings(db, req.studioOwner, req.body)));
}
