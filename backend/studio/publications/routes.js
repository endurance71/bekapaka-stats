import { z } from 'zod';
import { channelIds, channels, itemStatuses, PUBLICATION_VERSION } from './channels.js';
import { playbooks, PLAYBOOK_VERSION } from './playbooks.js';
import { TEMPLATE_VERSION } from './templates.js';
import { LINT_VERSION } from './brand-lint.js';
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
      versions: { publication: PUBLICATION_VERSION, playbooks: PLAYBOOK_VERSION, templates: TEMPLATE_VERSION, lint: LINT_VERSION },
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
  router.get('/settings', async (req, res) => res.json(await getSettings(db, req.studioOwner)));
  router.put('/settings', async (req, res) => res.json(await saveSettings(db, req.studioOwner, req.body)));
}
