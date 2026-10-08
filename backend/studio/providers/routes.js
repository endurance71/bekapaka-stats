// Settings → „Klucze API i modele”. Keys go in, only their status comes out.
import { z } from 'zod';
import { providerIds } from './catalog.js';
import { deleteProviderKey, providerKey, recordTest, saveProviderKey, secretsConfigured } from './secrets.js';
import { addCustomModel, aiOverview, removeCustomModel, setTaskModel } from './settings.js';
import { testKey } from './clients.js';

const provider = (p) => z.enum(providerIds).parse(p);
// Provider error texts can echo parts of the key, so only the HTTP status is kept.
function testError(err) {
  const status = err?.status ?? err?.code;
  if (status === 401 || status === 403) return 'Dostawca odrzucił klucz (brak uprawnień lub nieprawidłowy klucz)';
  if (status === 429) return 'Limit zapytań u dostawcy — spróbuj za chwilę';
  return status ? `Dostawca odpowiedział błędem ${status}` : 'Brak połączenia z dostawcą';
}

export function aiRoutes(router, db) {
  const overview = async (req) => ({ ...(await aiOverview(db, req.studioOwner)), secretsConfigured: secretsConfigured() });
  router.get('/ai/overview', async (req, res) => res.json(await overview(req)));
  router.put('/ai/keys/:provider', async (req, res) => {
    await saveProviderKey(db, req.studioOwner, provider(req.params.provider), req.body);
    res.json(await overview(req));
  });
  router.delete('/ai/keys/:provider', async (req, res) => {
    await deleteProviderKey(db, req.studioOwner, provider(req.params.provider));
    res.json(await overview(req));
  });
  // Lists models with the stored key (free on every provider) and records the outcome.
  router.post('/ai/keys/:provider/test', async (req, res) => {
    const id = provider(req.params.provider);
    const key = await providerKey(db, req.studioOwner, id);
    if (!key) return res.status(404).json({ error: 'Brak klucza tego dostawcy' });
    let ok = true;
    let error = null;
    try {
      await testKey(id, key.apiKey);
    } catch (err) {
      ok = false;
      error = testError(err);
    }
    if (key.source === 'studio') await recordTest(db, req.studioOwner, id, ok, error);
    res.json({ ok, error, overview: await overview(req) });
  });
  router.put('/ai/tasks', async (req, res) => {
    await setTaskModel(db, req.studioOwner, req.body);
    res.json(await overview(req));
  });
  router.post('/ai/custom-models', async (req, res) => {
    await addCustomModel(db, req.studioOwner, req.body);
    res.status(201).json(await overview(req));
  });
  router.delete('/ai/custom-models/:id', async (req, res) => {
    await removeCustomModel(db, req.studioOwner, z.string().max(80).parse(req.params.id));
    res.json(await overview(req));
  });
}
