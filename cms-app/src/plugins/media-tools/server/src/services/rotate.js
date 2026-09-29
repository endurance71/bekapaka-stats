'use strict';

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');

const SUPPORTED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const activeRotations = new Set();

function assertValidAngle(angle) {
  if (angle !== 90 && angle !== -90) {
    throw new Error('Kąt obrotu musi wynosić 90 lub -90 stopni.');
  }
}

function encoderFor(mime, pipeline) {
  if (mime === 'image/png') return pipeline.png();
  if (mime === 'image/webp') return pipeline.webp({ quality: 87 });
  return pipeline.jpeg({ quality: 87, mozjpeg: true });
}

function fileFields(record) {
  return {
    name: record.name,
    alternativeText: record.alternativeText,
    caption: record.caption,
    focalPoint: record.focalPoint,
    width: record.width,
    height: record.height,
    formats: record.formats,
    hash: record.hash,
    ext: record.ext,
    mime: record.mime,
    size: record.size,
    sizeInBytes: record.sizeInBytes,
    url: record.url,
    previewUrl: record.previewUrl,
    provider: record.provider,
    provider_metadata: record.provider_metadata,
    folderPath: record.folderPath,
  };
}

module.exports = ({ strapi }) => {
  const configuredProvider = () => strapi.config.get('plugin::upload.provider', 'local');

  const readAsset = async (asset) => {
    if ((asset.provider || configuredProvider()) === 'local') {
      const localPath = path.join(strapi.dirs.static.public, 'uploads', `${asset.hash}${asset.ext}`);
      return fsp.readFile(localPath);
    }

    const serverUrl = strapi.config.get('server.url', 'http://127.0.0.1:1337');
    const sourceUrl = new URL(asset.url, serverUrl);
    const response = await (strapi.fetch || fetch)(sourceUrl, {
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) {
      throw new Error(`Nie udało się pobrać pliku ze storage (${response.status}).`);
    }
    return Buffer.from(await response.arrayBuffer());
  };

  const snapshotStoredFiles = async (file) => {
    const assets = [file, ...Object.values(file.formats || {})];
    return Promise.all(assets.map(async (asset) => ({
      meta: { ...asset, provider: file.provider },
      buffer: await readAsset({ ...asset, provider: file.provider }),
    })));
  };

  const restoreStoredFiles = async (snapshots, tempDirectory) => {
    const providerService = strapi.plugin('upload').service('provider');
    for (const [index, snapshot] of snapshots.entries()) {
      const filepath = path.join(tempDirectory, `rollback-${index}${snapshot.meta.ext}`);
      await fsp.writeFile(filepath, snapshot.buffer);
      const restored = {
        ...snapshot.meta,
        filepath,
        size: snapshot.buffer.length / 1024,
        sizeInBytes: snapshot.buffer.length,
        getStream: () => fs.createReadStream(filepath),
      };
      await providerService.replace(restored, snapshot.meta);
    }
  };

  return {
    async rotateImage(fileId, angle, user) {
      assertValidAngle(angle);

      if (activeRotations.has(fileId)) {
        throw new Error('To zdjęcie jest już obracane. Poczekaj na zakończenie operacji.');
      }
      activeRotations.add(fileId);

      let tempDirectory;
      let fileRecord;
      let snapshots = [];

      try {
        tempDirectory = await fsp.mkdtemp(path.join(os.tmpdir(), 'strapi-media-rotate-'));
        fileRecord = await strapi.plugin('upload').service('upload').findOne(fileId);
        if (!fileRecord) throw new Error('Plik nie znaleziony.');
        if (!SUPPORTED_MIMES.has(fileRecord.mime)) {
          throw new Error(`Nieobsługiwany typ pliku: ${fileRecord.mime}. Obsługiwane: JPEG, PNG, WebP.`);
        }

        snapshots = await snapshotStoredFiles(fileRecord);
        const originalBuffer = snapshots[0].buffer;

        // Sharp applies EXIF normalization and the editor-requested turn in separate
        // pipelines so an EXIF orientation flag can never swallow the manual rotation.
        const normalizedBuffer = await sharp(originalBuffer, { failOnError: true })
          .rotate()
          .toBuffer();
        const rotated = await encoderFor(
          fileRecord.mime,
          sharp(normalizedBuffer, { failOnError: true }).rotate(angle)
        ).toBuffer({ resolveWithObject: true });

        if (!rotated.data.length || !rotated.info.width || !rotated.info.height) {
          throw new Error('Obrót zdjęcia nie powiódł się — wynik jest nieprawidłowy.');
        }

        // Decode the complete result before touching storage.
        await sharp(rotated.data, { failOnError: true }).stats();

        const rotatedPath = path.join(tempDirectory, `rotated${fileRecord.ext}`);
        await fsp.writeFile(rotatedPath, rotated.data);
        const inputFile = {
          filepath: rotatedPath,
          originalFilename: fileRecord.name,
          mimetype: fileRecord.mime,
          detectedMimeType: fileRecord.mime,
          size: rotated.data.length,
        };

        // The official upload service preserves the asset ID and URL, uses the
        // configured provider and regenerates thumbnail/responsive formats.
        const updated = await strapi.plugin('upload').service('upload').replace(fileId, {
          data: {
            fileInfo: {
              name: fileRecord.name,
              alternativeText: fileRecord.alternativeText,
              caption: fileRecord.caption,
              focalPoint: fileRecord.focalPoint,
            },
            path: fileRecord.path,
          },
          file: inputFile,
        }, { user });

        strapi.log.info(
          `[media-tools] Rotated ${fileRecord.name} by ${angle}°: ` +
          `${fileRecord.width}x${fileRecord.height} -> ${updated.width}x${updated.height}`
        );
        return updated;
      } catch (error) {
        if (fileRecord && snapshots.length) {
          try {
            await restoreStoredFiles(snapshots, tempDirectory);
            await strapi.db.query('plugin::upload.file').update({
              where: { id: fileId },
              data: fileFields(fileRecord),
            });
          } catch (rollbackError) {
            strapi.log.error('[media-tools] Rotate rollback failed', rollbackError);
            error.message = `${error.message} Przywrócenie pliku również nie powiodło się; sprawdź log serwera.`;
          }
        }
        throw error;
      } finally {
        activeRotations.delete(fileId);
        if (tempDirectory) await fsp.rm(tempDirectory, { recursive: true, force: true });
      }
    },
  };
};

module.exports.assertValidAngle = assertValidAngle;
