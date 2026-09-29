const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');

const rotateServiceFactory = require('../src/plugins/media-tools/server/src/services/rotate');
const rotateRoutes = require('../src/plugins/media-tools/server/src/routes');

describe('media-tools rotate service', () => {
  let root;
  let uploadDir;
  let rotateService;
  const records = new Map();
  const relations = new Map();
  const calls = { user: null };

  const createRecord = async ({ id, name, mime, width, height, alpha = false }) => {
    const ext = mime === 'image/png' ? '.png' : mime === 'image/webp' ? '.webp' : '.jpg';
    const hash = `asset_${id}`;
    const originalPath = path.join(uploadDir, `${hash}${ext}`);
    let pipeline = sharp({
      create: {
        width,
        height,
        channels: alpha ? 4 : 3,
        background: alpha ? { r: 30, g: 80, b: 180, alpha: 0.45 } : { r: 180, g: 60, b: 30 },
      },
    });
    if (mime === 'image/png') pipeline = pipeline.png();
    else if (mime === 'image/webp') pipeline = pipeline.webp();
    else pipeline = pipeline.jpeg();
    await pipeline.toFile(originalPath);

    const thumbnailPath = path.join(uploadDir, `thumbnail_${hash}${ext}`);
    await sharp(originalPath).resize({ width: 245, height: 156, fit: 'inside' }).toFile(thumbnailPath);
    const thumbInfo = await sharp(thumbnailPath).metadata();
    const record = {
      id,
      name,
      alternativeText: `Alt ${name}`,
      caption: null,
      hash,
      ext,
      mime,
      width,
      height,
      provider: 'local',
      url: `/uploads/${hash}${ext}`,
      formats: {
        thumbnail: {
          name: `thumbnail_${name}`,
          hash: `thumbnail_${hash}`,
          ext,
          mime,
          provider: 'local',
          width: thumbInfo.width,
          height: thumbInfo.height,
          url: `/uploads/thumbnail_${hash}${ext}`,
        },
      },
    };
    records.set(id, record);
    relations.set(id, [{ __type: 'api::news-post.news-post', id: 77, field: 'coverImage' }]);
  };

  before(async () => {
    root = await fsp.mkdtemp(path.join(os.tmpdir(), 'media-tools-test-'));
    uploadDir = path.join(root, 'uploads');
    await fsp.mkdir(uploadDir);
    await createRecord({ id: 1, name: 'landscape.jpg', mime: 'image/jpeg', width: 2400, height: 1600 });
    await createRecord({ id: 2, name: 'portrait.jpg', mime: 'image/jpeg', width: 1600, height: 2400 });
    await createRecord({ id: 3, name: 'alpha.png', mime: 'image/png', width: 800, height: 500, alpha: true });
    await createRecord({ id: 4, name: 'photo.webp', mime: 'image/webp', width: 900, height: 600 });
    records.set(5, { id: 5, name: 'doc.pdf', hash: 'doc', ext: '.pdf', mime: 'application/pdf', provider: 'local' });

    const uploadService = {
      findOne: async (id) => records.get(Number(id)) || null,
      replace: async (id, { file }, { user }) => {
        calls.user = user;
        const record = records.get(Number(id));
        const original = await fsp.readFile(file.filepath);
        await fsp.writeFile(path.join(uploadDir, `${record.hash}${record.ext}`), original);
        const metadata = await sharp(original).metadata();
        const thumbnail = await sharp(original).resize({ width: 245, height: 156, fit: 'inside' }).toBuffer({ resolveWithObject: true });
        await fsp.writeFile(path.join(uploadDir, `thumbnail_${record.hash}${record.ext}`), thumbnail.data);
        Object.assign(record, {
          width: metadata.width,
          height: metadata.height,
          sizeInBytes: original.length,
          size: original.length / 1024,
          updatedAt: new Date().toISOString(),
          formats: {
            thumbnail: {
              ...record.formats.thumbnail,
              width: thumbnail.info.width,
              height: thumbnail.info.height,
              sizeInBytes: thumbnail.data.length,
            },
          },
        });
        return record;
      },
    };
    const providerService = {
      replace: async (file, oldFile) => {
        await fsp.copyFile(file.filepath, path.join(uploadDir, `${oldFile.hash}${oldFile.ext}`));
      },
    };
    const strapi = {
      dirs: { static: { public: root } },
      config: { get: (key, fallback) => key === 'plugin::upload.provider' ? 'local' : fallback },
      plugin: (name) => {
        assert.equal(name, 'upload');
        return { service: (service) => service === 'upload' ? uploadService : providerService };
      },
      db: {
        query: () => ({
          update: async ({ where, data }) => Object.assign(records.get(Number(where.id)), data),
        }),
      },
      log: { info() {}, error() {} },
    };
    rotateService = rotateServiceFactory({ strapi });
  });

  after(async () => {
    await fsp.rm(root, { recursive: true, force: true });
  });

  it('rotates a landscape JPEG right and regenerates a portrait thumbnail', async () => {
    const user = { id: 12 };
    const result = await rotateService.rotateImage(1, 90, user);
    assert.equal(result.id, 1);
    assert.equal(result.url, '/uploads/asset_1.jpg');
    assert.deepEqual([result.width, result.height], [1600, 2400]);
    assert.ok(result.formats.thumbnail.height > result.formats.thumbnail.width);
    assert.equal(calls.user, user);
  });

  it('rotates a portrait JPEG left', async () => {
    const result = await rotateService.rotateImage(2, -90, { id: 12 });
    assert.deepEqual([result.width, result.height], [2400, 1600]);
  });

  it('preserves PNG alpha', async () => {
    const result = await rotateService.rotateImage(3, 90, { id: 12 });
    assert.deepEqual([result.width, result.height], [500, 800]);
    const metadata = await sharp(path.join(uploadDir, 'asset_3.png')).metadata();
    assert.equal(metadata.hasAlpha, true);
  });

  it('preserves WebP encoding', async () => {
    await rotateService.rotateImage(4, 90, { id: 12 });
    const metadata = await sharp(path.join(uploadDir, 'asset_4.webp')).metadata();
    assert.equal(metadata.format, 'webp');
    assert.deepEqual([metadata.width, metadata.height], [600, 900]);
  });

  it('keeps the same asset identity, URL and existing relations', async () => {
    const before = structuredClone(records.get(1));
    const relationBefore = structuredClone(relations.get(1));
    const result = await rotateService.rotateImage(1, -90, { id: 12 });
    assert.equal(result.id, before.id);
    assert.equal(result.url, before.url);
    assert.deepEqual(relations.get(1), relationBefore);
  });

  it('rejects invalid angles before reading storage', async () => {
    await assert.rejects(() => rotateService.rotateImage(1, 45, { id: 12 }), /90 lub -90/);
  });

  it('rejects unsupported files', async () => {
    await assert.rejects(() => rotateService.rotateImage(5, 90, { id: 12 }), /Nieobsługiwany typ pliku/);
  });

  it('exposes rotate only as an authenticated admin route with upload update permission', () => {
    const route = rotateRoutes.admin.routes.find((item) => item.path === '/rotate');
    assert.equal(route.method, 'POST');
    assert.ok(route.config.policies.includes('admin::isAuthenticatedAdmin'));
    const permissionPolicy = route.config.policies.find((policy) => typeof policy === 'object');
    assert.deepEqual(permissionPolicy.config.actions, ['plugin::upload.assets.update']);
  });
});
