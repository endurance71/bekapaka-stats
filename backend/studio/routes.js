import { statisticalSnapshot } from './statistics.js';
import { postTypes, visualStyles, postType, designKey, DESIGN_VERSION, designFormats } from './post-types.js';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { z, ZodError } from 'zod';
import { ownerId, origin, cookieName, cookieOptions, brandDir, fail } from './config.js';
import { templates, formats, BRAND_VERSION, assetMetadataSchema, partnerSchema } from './contracts.js';
import { hash, saveImage, filePath } from './storage.js';
import { seedStudio } from './seed.js';
import { projectView, createProject, updateProject, validation, queueJob, context } from './service.js';
import { budget, queueAi } from './ai.js';
import { matchSnapshot, matches, cms, cmsMedia, sourceEnvelope, roundOptions } from './sources.js';
import { createLoginThrottle } from '../lib/loginThrottle.js';
import { publicationRoutes } from './publications/routes.js';
import { mcpRoutes } from './agent/mcp.js';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 2, fieldSize: 8000 } });
const ack = z.object({ confirmed: z.literal(true) }).strict();
const jid = value => z.string().uuid().parse(value);
const safeAsset = a => { const { storageKey, ...rest } = a; return rest; };
const safeJob = j => { const { leaseToken, payload, ...rest } = j; return rest; };
export function createStudioRouter({ db, loginUser }) {
  const router = express.Router(); const throttle = createLoginThrottle({ limit: 10 });
  // Agents use Bearer tokens instead of the owner's cookie, so MCP sits before the CSRF and session checks.
  mcpRoutes(router, db);
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store'); res.set('X-Content-Type-Options', 'nosniff');
    if (!ownerId()) return res.status(503).json({ error: 'Studio czeka na konfigurację właściciela' });
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && (req.get('Origin') !== origin() || req.get('X-Studio-Request') !== '1')) return res.status(403).json({ error: 'Nieprawidłowe źródło żądania' });
    next();
  });
  router.post('/auth/login', async (req, res) => {
    const data = z.object({ username: z.string().trim().min(1).max(100), password: z.string().min(1).max(200) }).strict().parse(req.body);
    if (!throttle.check(req.ip, data.username)) fail(429, 'Zbyt wiele prób. Spróbuj za 15 minut.');
    const found = await loginUser(data.username, data.password, req.ip);
    if (!found || found.user.id !== ownerId()) fail(401, 'Nieprawidłowe dane logowania lub brak dostępu do Studio');
    const account = await db.rosterPlayer.findUnique({ where: { id: ownerId() }, select: { password: true } });
    if (!account?.password) fail(401, 'Konto nie jest aktywne');
    const token = crypto.randomBytes(32).toString('base64url');
    await db.studioSession.create({ data: { id: hash(token), credentialHash: hash(account.password), ownerId: ownerId(), expiresAt: new Date(Date.now() + 12 * 3600_000) } });
    throttle.clear(req.ip, data.username);
    await seedStudio(db);
    res.cookie(cookieName, token, cookieOptions()).json({ user: { id: found.user.id, firstName: found.user.firstName, lastName: found.user.lastName } });
  });
  router.use(async (req, res, next) => {
    const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) fail(401, 'Zaloguj się do Studio');
    const session = await db.studioSession.findUnique({ where: { id: hash(token) } });
    if (!session || session.ownerId !== ownerId() || session.expiresAt <= new Date()) fail(401, 'Sesja wygasła');
    const owner = await db.rosterPlayer.findUnique({ where: { id: ownerId() }, select: { id: true, firstName: true, lastName: true, password: true } });
    if (!owner?.password || session.credentialHash !== hash(owner.password)) fail(401, 'Dane konta zmieniły się. Zaloguj się ponownie.');
    req.studioOwner = owner.id; req.studioSession = session.id; req.studioUser = { id: owner.id, firstName: owner.firstName, lastName: owner.lastName }; next();
  });
  router.get('/auth/me', (req, res) => res.json({ user: req.studioUser }));
  router.post('/auth/logout', async (req, res) => { await db.studioSession.deleteMany({ where: { id: req.studioSession } }); res.clearCookie(cookieName, cookieOptions()).json({ ok: true }); });
  router.get('/templates', async (req, res) => {
    await seedStudio(db);
    const states = await db.studioTemplate.findMany({ where: { ownerId: req.studioOwner, brandVersion: BRAND_VERSION } });
    res.json({ brandVersion: BRAND_VERSION, formats, visualStyles, postTypes:postTypes.map(p=>({...p,designs:p.styles.flatMap(style=>designFormats(p,style).flatMap(format=>['A','B'].flatMap(kit=>{ const prefix=designKey({postType:p.id,visualStyle:style,designVersion:DESIGN_VERSION,content:{kit}},format); const matches=states.filter(s=>s.family===p.family&&s.version.startsWith(prefix.replace('material-brand','material-')));return [{style,format,kit,backgroundAssetId:null,status:states.find(s=>s.version===prefix)?.status || 'draft'},...matches.filter(s=>s.version!==prefix).map(s=>({style,format,kit,backgroundAssetId:s.version.split(':material-')[1],status:s.status}))];})))})), templates: templates.map(t => ({ ...t, ...states.find(s => s.family === t.id && s.version === t.version) })) });
  });
  router.post('/templates/:family/approve', async (req, res) => {
    fail(422,'Historyczna rodzina nie ma sprawdzonego wzorca. Przenieś projekt do bieżącej kompozycji');
  });
  router.post('/designs/:postType/:style/:format/approve', async (req,res) => {
    const input=z.object({confirmed:z.literal(true),previewJobId:z.string().uuid()}).strict().parse(req.body);
    const type=postType(req.params.postType);
    if (!type || !type.styles.includes(req.params.style) || !designFormats(type,req.params.style).includes(req.params.format)) fail(404,'Kompozycja nie istnieje');
    const preview=await db.studioJob.findFirst({where:{id:input.previewJobId,ownerId:req.studioOwner,kind:'preview',status:'completed'}});
    if (!preview || preview.payload.format!==req.params.format || new Date(preview.result?.expiresAt || 0)<=new Date()) fail(422,'Oceń aktualny podgląd wybranego formatu');
    const view=await projectView(db,req.studioOwner,preview.projectId);
    if (view.payload.designVersion!==DESIGN_VERSION || view.currentRevision!==preview.revision || view.payload.postType!==type.id || view.payload.visualStyle!==req.params.style || view.revision.brandVersion!==BRAND_VERSION || preview.result?.resourceHash!==(await context(db,req.studioOwner,view)).resourceHash) fail(422,'Podgląd dotyczy innej kompozycji, rewizji lub materiałów');
    const version=designKey(view.payload,req.params.format);
    const id=`${req.studioOwner}:${type.family}:${version}:${BRAND_VERSION}`;
    await db.studioTemplate.upsert({where:{id},create:{id,ownerId:req.studioOwner,family:type.family,version,brandVersion:BRAND_VERSION,status:'approved',approvedAt:new Date()},update:{status:'approved',approvedAt:new Date()}});
    res.json({ok:true});
  });
  router.post('/designs/:postType/:style/:format/status', async(req,res)=>{
    const type=postType(req.params.postType);if(!type || !type.styles.includes(req.params.style)||!designFormats(type,req.params.style).includes(req.params.format)) fail(404,'Kompozycja nie istnieje');
    const input=z.object({status:z.enum(['draft','retired']),kit:z.enum(['A','B']),backgroundAssetId:z.string().max(128).nullable().default(null)}).strict().parse(req.body);
    const version=designKey({postType:type.id,visualStyle:req.params.style,designVersion:DESIGN_VERSION,content:{kit:input.kit,backgroundAssetId:input.backgroundAssetId}},req.params.format);
    const id=`${req.studioOwner}:${type.family}:${version}:${BRAND_VERSION}`;
    await db.studioTemplate.upsert({where:{id},create:{id,ownerId:req.studioOwner,family:type.family,version,brandVersion:BRAND_VERSION,status:input.status},update:{status:input.status,approvedAt:null}});
    res.json({ok:true});
  });
  router.post('/templates/:family/status', async (req, res) => {
    const input = z.object({ status: z.enum(['draft', 'retired']) }).strict().parse(req.body);
    await db.studioTemplate.updateMany({ where: { ownerId: req.studioOwner, family: req.params.family, version:'1.0.0', brandVersion: BRAND_VERSION }, data: { status: input.status, approvedAt: null } }); res.json({ ok: true });
  });
  router.get('/brand', async (_req, res) => res.json(JSON.parse(await fs.readFile(path.join(brandDir, 'manifest.json'), 'utf8'))));
  router.get('/sources/seasons', async (_req, res) => res.json(await db.kalkSeason.findMany({ orderBy: [{ isActive: 'desc' }, { startsAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }] })));
  router.get('/sources/matches', async (req, res) => res.json(await matches(db, String(req.query.seasonId || ''))));
  router.get('/sources/statistical-matches',async(req,res)=>res.json((await db.kalkMatch.findMany({where:{seasonId:String(req.query.seasonId || ''),isFinished:true},orderBy:{date:'desc'},take:300})).filter(m=>/bekapaka|bobolice/i.test(m.homeTeamName+' '+m.guestTeamName)).map(matchSnapshot)));
  router.get('/sources/statistics', async (req,res)=> { const q=z.object({kind:z.enum(['standings','round','season','match-statistics']),seasonId:z.string().min(1),id:z.string().default(''),subjectId:z.string().max(128).default(''),view:z.enum(['team','player','leaders']).default('team')}).parse(req.query); res.json(sourceEnvelope(q.kind,await statisticalSnapshot(db,q.kind,q.seasonId,q.id,q.subjectId,q.view))); });
  router.get('/sources/rounds',async(req,res)=>res.json(roundOptions((await db.leagueMatch.findMany({where:{seasonId:String(req.query.seasonId || ''),isFinished:true,phaseLabel:{not:null}},select:{phaseLabel:true},distinct:['phaseLabel']})).map(r=>r.phaseLabel))));
  router.get('/sources/players', async (_req, res) => res.json((await db.rosterPlayer.findMany({ orderBy: { lastName: 'asc' }, select: { id: true, firstName: true, lastName: true, number: true, position: true } })).map(p => ({ ...p, number: String(p.number ?? ''), position: p.position || '' }))));
  router.get('/sources/cms/:kind', async (req, res) => { const kind = z.enum(['event', 'news']).parse(req.params.kind); res.json(await cms(kind)); });
  router.get('/sources/snapshot', async (req, res) => {
    const s = z.object({ kind: z.enum(['match', 'player', 'event', 'news','standings','round','season','match-statistics']), id: z.string().min(1).max(128), seasonId: z.string().max(128).optional(), subjectId:z.string().max(128).default(''),view:z.enum(['team','player','leaders']).default('team') }).parse(req.query);
    let data;
    if (['standings','round','season','match-statistics'].includes(s.kind)) data=await statisticalSnapshot(db,s.kind,s.seasonId,s.id,s.subjectId,s.view);
    else if (s.kind === 'match') data = (await matches(db, s.seasonId)).find(m => m.id === s.id);
    else if (s.kind === 'player') { const p = await db.rosterPlayer.findUnique({ where: { id: s.id }, select: { id: true, firstName: true, lastName: true, number: true, position: true } }); if (p) data = { id: p.id, firstName: p.firstName, lastName: p.lastName, number: String(p.number ?? ''), position: p.position || '' }; }
    else data = (await cms(s.kind, s.id))[0];
    if (!data) fail(404, 'Źródło nie jest już dostępne'); res.json(sourceEnvelope(s.kind, data));
  });
  router.get('/projects', async (req, res) => res.json(await db.studioProject.findMany({ where: { ownerId: req.studioOwner }, orderBy: { updatedAt: 'desc' }, take: 200, include: { jobs: { where: { kind: 'preview', status: 'completed' }, orderBy: { createdAt: 'desc' }, take: 1 } } })));
  router.post('/projects', async (req, res) => res.status(201).json(await createProject(db, req.studioOwner, req.body)));
  router.get('/projects/:id', async (req, res) => res.json(await projectView(db, req.studioOwner, jid(req.params.id))));
  router.put('/projects/:id', async (req, res) => { const input = z.object({ expectedRevision: z.number().int().min(1), project: z.unknown() }).strict().parse(req.body); res.json(await updateProject(db, req.studioOwner, jid(req.params.id), input.expectedRevision, input.project)); });
  router.post('/projects/:id/duplicate', async (req, res) => { const v = await projectView(db, req.studioOwner, jid(req.params.id)); res.json(await createProject(db, req.studioOwner, { ...v.payload, name: `${v.name.slice(0, 165)} — kopia` })); });
  router.post('/projects/:id/archive', async (req, res) => { ack.parse(req.body); const v = await projectView(db, req.studioOwner, jid(req.params.id)); await db.studioProject.update({ where: { id: v.id }, data: { status: 'archived' } }); res.json({ ok: true }); });
  router.post('/projects/:id/restore', async (req, res) => { ack.parse(req.body); const v = await projectView(db, req.studioOwner, jid(req.params.id)); if (v.status !== 'archived') fail(409, 'Projekt nie jest zarchiwizowany'); await db.studioProject.update({ where: { id: v.id }, data: { status: 'draft' } }); res.json(await projectView(db, req.studioOwner, v.id)); });
  router.get('/projects/:id/preview', async (req, res) => {
    // Read-only lookup of the newest completed, non-expired preview (used for archived projects, which cannot queue renders).
    const format = z.enum(Object.keys(formats)).parse(req.query.format);
    const v = await projectView(db, req.studioOwner, jid(req.params.id));
    const jobs = await db.studioJob.findMany({ where: { ownerId: req.studioOwner, projectId: v.id, kind: 'preview', status: 'completed', payload: { path: ['format'], equals: format } }, orderBy: [{ revision: 'desc' }, { createdAt: 'desc' }], take: 10 });
    const now = new Date();
    const job = jobs.find(j => j.result?.files?.length && j.result.expiresAt && new Date(j.result.expiresAt) > now);
    res.json(job ? safeJob(job) : null);
  });
  router.get('/projects/:id/revisions', async (req, res) => { const v = await projectView(db, req.studioOwner, jid(req.params.id)); res.json(await db.studioRevision.findMany({ where: { projectId: v.id }, orderBy: { number: 'desc' }, take: 100 })); });
  router.get('/projects/:id/validation', async (req, res) => { const v = await projectView(db, req.studioOwner, jid(req.params.id)); res.json(await validation(db, req.studioOwner, v)); });
  router.post('/projects/:id/approve', async (req, res) => {
    const input = z.object({ confirmed: z.literal(true), expectedRevision: z.number().int().min(1), previewJobId: z.string().uuid() }).strict().parse(req.body);
    await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "StudioProject" WHERE id = ${jid(req.params.id)} FOR UPDATE`;
      const v = await projectView(tx, req.studioOwner, req.params.id);
      if (v.currentRevision !== input.expectedRevision) fail(409, 'Rewizja zmieniła się. Sprawdź aktualne dane.');
      const ctx = await context(tx, req.studioOwner, v);
      const preview = await tx.studioJob.findFirst({ where: { id: input.previewJobId, projectId: v.id, revision: v.currentRevision, ownerId: req.studioOwner, status: 'completed', kind: 'preview' } });
      if (!preview || preview.result?.resourceHash !== ctx.resourceHash) fail(422, 'Materiały zmieniły się od podglądu. Wygeneruj i oceń aktualny podgląd.');
      await tx.studioApproval.upsert({ where: { revisionId_ownerId: { revisionId: v.revision.id, ownerId: req.studioOwner } }, create: { revisionId: v.revision.id, ownerId: req.studioOwner, contentHash: v.revision.contentHash, resourceHash: ctx.resourceHash }, update: { resourceHash: ctx.resourceHash } });
    }); res.json({ ok: true });
  });
  router.post('/projects/:id/jobs', async (req, res) => {
    const input = z.object({ kind: z.enum(['preview', 'export', 'ai-text', 'ai-image']), format: z.enum(Object.keys(formats)).optional(), idempotencyKey: z.string().min(8).max(128).optional(), brief: z.enum(['texture', 'background', 'still-life']).optional() }).strict().parse(req.body);
    const v = await projectView(db, req.studioOwner, jid(req.params.id)); if (v.status === 'archived') fail(409, 'Projekt jest zarchiwizowany');
    if (input.kind === 'export' && !input.idempotencyKey) fail(400, 'Eksport wymaga klucza idempotencji');
    if (input.kind === 'preview' && !v.payload.formats.includes(input.format)) fail(400, 'Wybierz format projektu');
    const job = input.kind.startsWith('ai-') ? await queueAi(db, req.studioOwner, v, input.kind.slice(3), ({ texture: 'abstract ink and paper texture', background: 'empty indoor basketball court', 'still-life': 'basketball on parquet, still life' })[input.brief || 'texture']) : await queueJob(db, req.studioOwner, v, input.kind, input.kind === 'preview' ? { format: input.format } : {}, input.idempotencyKey);
    res.status(202).json(safeJob(job));
  });
  router.get('/jobs/:id', async (req, res) => { const job = await db.studioJob.findFirst({ where: { id: jid(req.params.id), ownerId: req.studioOwner } }); if (!job) fail(404, 'Zadanie nie istnieje'); res.json(safeJob(job)); });
  router.get('/jobs/:id/files/:key', async (req, res) => {
    const job = await db.studioJob.findFirst({ where: { id: jid(req.params.id), ownerId: req.studioOwner, status: 'completed' } });
    const file = job?.result?.files?.find(f => f.key === req.params.key);
    if (!file || !job.result.expiresAt || new Date(job.result.expiresAt) <= new Date()) fail(404, 'Plik wygasł. Wygeneruj go ponownie.');
    res.type(file.mime); if (req.query.download === '1') res.attachment(file.name); res.sendFile(filePath(file.storageKey));
  });
  router.get('/exports', async (req, res) => res.json(await db.studioExport.findMany({ where: { ownerId: req.studioOwner }, orderBy: { createdAt: 'desc' }, take: 200, include: { project: { select: { name: true, family: true } } } })));
  router.get('/assets', async (req, res) => res.json((await db.studioAsset.findMany({ where: { ownerId: req.studioOwner }, orderBy: { createdAt: 'desc' }, take: 500 })).map(safeAsset)));
  router.post('/assets/import-cms', async (req, res) => {
    const input = z.object({ kind: z.enum(['event', 'news']), documentId: z.string().min(1).max(128), mediaId: z.string().min(1).max(128) }).strict().parse(req.body);
    const media = await cmsMedia(input.kind, input.documentId, input.mediaId); const image = await saveImage(media.buffer);
    res.status(201).json(safeAsset(await db.studioAsset.create({ data: { ...image, ownerId: req.studioOwner, name: media.name.slice(0, 180), origin: media.origin.slice(0, 500), kind: 'photo' } })));
  });
  router.post('/assets', upload.single('file'), async (req, res) => {
    if (!req.file) fail(400, 'Wybierz plik'); const meta = assetMetadataSchema.parse(JSON.parse(req.body.metadata || '{}'));
    if (meta.status === 'approved' && !['granted', 'not_required'].includes(meta.consent)) fail(422, 'Zatwierdzenie wymaga potwierdzenia dopuszczalności publikacji');
    const image = await saveImage(req.file.buffer);
    try { res.status(201).json(safeAsset(await db.studioAsset.create({ data: { ...meta, ...image, ownerId: req.studioOwner } }))); }
    catch (err) { await fs.unlink(filePath(image.storageKey)).catch(() => {}); throw err; }
  });
  router.put('/assets/:id', async (req, res) => {
    const meta = assetMetadataSchema.parse(req.body); const a = await db.studioAsset.findFirst({ where: { id: jid(req.params.id), ownerId: req.studioOwner } }); if (!a) fail(404, 'Materiał nie istnieje');
    if (meta.status === 'approved' && !['granted', 'not_required'].includes(meta.consent)) fail(422, 'Potwierdź dopuszczalność publikacji');
    if (a.provenance && meta.kind !== 'background') fail(422, 'Ilustracja AI może być tylko tłem');
    res.json(safeAsset(await db.studioAsset.update({ where: { id: a.id }, data: meta })));
  });
  router.get('/assets/:id/file', async (req, res) => { const a = await db.studioAsset.findFirst({ where: { id: jid(req.params.id), ownerId: req.studioOwner } }); if (!a) fail(404, 'Materiał nie istnieje'); res.type(a.mime).sendFile(filePath(a.storageKey)); });
  router.get('/partners', async (req, res) => res.json(await db.studioPartner.findMany({ where: { ownerId: req.studioOwner }, orderBy: { name: 'asc' } })));
  router.get('/partners/:id/logo', async (req, res) => { const p = await db.studioPartner.findFirst({ where: { id: req.params.id, ownerId: req.studioOwner } }); if (!p?.seedLogo || !/^logo-\d\d\.png$/.test(p.seedLogo)) fail(404, 'Partner używa plakietki tekstowej'); res.type('png').sendFile(path.join(brandDir, '02_system/partnerzy', p.seedLogo)); });
  router.post('/partners', async (req, res) => { const data = partnerSchema.parse(req.body); if (data.assetId && !await db.studioAsset.findFirst({ where: { id: data.assetId, ownerId: req.studioOwner, kind: 'logo' } })) fail(422, 'Wybierz logo z biblioteki'); res.json(await db.studioPartner.create({ data: { ...data, id: crypto.randomUUID(), ownerId: req.studioOwner } })); });
  router.put('/partners/:id', async (req, res) => { const data = partnerSchema.parse(req.body); const p = await db.studioPartner.findFirst({ where: { id: req.params.id, ownerId: req.studioOwner } }); if (!p) fail(404, 'Partner nie istnieje'); if (data.assetId && !await db.studioAsset.findFirst({ where: { id: data.assetId, ownerId: req.studioOwner, kind: 'logo' } })) fail(422, 'Wybierz logo z biblioteki'); res.json(await db.studioPartner.update({ where: { id: p.id }, data })); });
  router.get('/ai/budget', async (req, res) => res.json(await budget(db, req.studioOwner)));
  publicationRoutes(router, db);
  router.use((err, _req, res, _next) => {
    if (err instanceof ZodError) return res.status(400).json({ error: 'Sprawdź pola formularza', details: err.issues.map(i => ({ field: i.path.join('.'), message: i.message })) });
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Plik przekracza 20 MB' });
    if (!err.status) console.error('Studio request failed', err.name, err.code || 'internal');
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Nie udało się wykonać operacji Studio', ...(err.details ? { details: err.details } : {}) });
  });
  return router;
}
