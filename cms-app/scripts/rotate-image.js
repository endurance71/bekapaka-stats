'use strict';

/**
 * CLI utility to safely rotate an image in Strapi Media Library by 90 or -90 degrees.
 * Keeps the same file ID, URL, folder, and relations.
 * Regenerates all responsive variants (thumbnail, small, medium, large).
 *
 * Usage:
 *   node scripts/rotate-image.js <fileId> <angle>
 * Example:
 *   node scripts/rotate-image.js 31 90
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createStrapi } = require('@strapi/strapi');

const SUPPORTED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const BREAKPOINTS = {
  large: { width: 1000, height: 1000, fit: 'inside' },
  medium: { width: 750, height: 750, fit: 'inside' },
  small: { width: 500, height: 500, fit: 'inside' },
};

const THUMBNAIL_OPTIONS = { width: 245, height: 156, fit: 'inside' };

function getEncoder(mime) {
  if (mime === 'image/png') return (pipeline) => pipeline.png();
  if (mime === 'image/webp') return (pipeline) => pipeline.webp({ quality: 87 });
  return (pipeline) => pipeline.jpeg({ quality: 87, mozjpeg: true });
}

async function run() {
  const args = process.argv.slice(2);
  const fileId = parseInt(args[0], 10);
  const angle = parseInt(args[1], 10);

  if (!fileId || (angle !== 90 && angle !== -90 && angle !== 180 && angle !== 270)) {
    console.error('Użycie: node scripts/rotate-image.js <fileId> <angle>');
    console.error('Dozwolone kąty: 90 (prawo), -90 (lewo), 180, 270');
    process.exit(1);
  }

  console.log(`[rotate-image] Inicjalizacja Strapi...`);
  const app = await createStrapi().load();

  try {
    const file = await app.db.query('plugin::upload.file').findOne({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error(`Plik o ID ${fileId} nie istnieje w Media Library.`);
    }

    if (!SUPPORTED_MIMES.includes(file.mime)) {
      throw new Error(`Nieobsługiwany format: ${file.mime}. Obsługiwane: JPEG, PNG, WebP.`);
    }

    const uploadDir = path.resolve(app.dirs.static.public, 'uploads');
    const filePath = path.join(uploadDir, `${file.hash}${file.ext}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Plik fizyczny nie istnieje na dysku: ${filePath}`);
    }

    console.log(`[rotate-image] Obracanie ${file.name} (${file.width}x${file.height}) o ${angle}°...`);
    const buffer = fs.readFileSync(filePath);
    const encode = getEncoder(file.mime);

    // 1. Normalizuj EXIF, obróć o podany kąt
    const rotatedResult = await encode(
      sharp(buffer, { failOnError: false }).rotate().rotate(angle)
    ).toBuffer({ resolveWithObject: true });

    const { data: rotatedBuffer, info: rotatedInfo } = rotatedResult;

    // 2. Zapisz plik główny w miejscu oryginału
    fs.writeFileSync(filePath, rotatedBuffer);

    // 3. Zregeneruj warianty
    const existingFormats = file.formats
      ? (typeof file.formats === 'string' ? JSON.parse(file.formats) : file.formats)
      : {};

    const newFormats = {};

    // Miniatura
    const thumbKey = `thumbnail_${file.hash}${file.ext}`;
    const thumbPath = path.join(uploadDir, thumbKey);
    const thumbResult = await encode(
      sharp(rotatedBuffer, { failOnError: false }).resize(THUMBNAIL_OPTIONS)
    ).toBuffer({ resolveWithObject: true });
    fs.writeFileSync(thumbPath, thumbResult.data);

    newFormats.thumbnail = {
      ...(existingFormats.thumbnail || {}),
      name: `thumbnail_${file.name}`,
      hash: `thumbnail_${file.hash}`,
      ext: file.ext,
      mime: file.mime,
      path: null,
      width: thumbResult.info.width,
      height: thumbResult.info.height,
      size: Math.round((thumbResult.data.length / 1024) * 100) / 100,
      sizeInBytes: thumbResult.data.length,
      url: `/uploads/${thumbKey}`,
    };

    // Breakpointy (large, medium, small)
    for (const [key, resizeOpts] of Object.entries(BREAKPOINTS)) {
      if (rotatedInfo.width > resizeOpts.width || rotatedInfo.height > resizeOpts.height) {
        const bpKey = `${key}_${file.hash}${file.ext}`;
        const bpPath = path.join(uploadDir, bpKey);
        const bpResult = await encode(
          sharp(rotatedBuffer, { failOnError: false }).resize(resizeOpts)
        ).toBuffer({ resolveWithObject: true });
        fs.writeFileSync(bpPath, bpResult.data);

        newFormats[key] = {
          ...(existingFormats[key] || {}),
          name: `${key}_${file.name}`,
          hash: `${key}_${file.hash}`,
          ext: file.ext,
          mime: file.mime,
          path: null,
          width: bpResult.info.width,
          height: bpResult.info.height,
          size: Math.round((bpResult.data.length / 1024) * 100) / 100,
          sizeInBytes: bpResult.data.length,
          url: `/uploads/${bpKey}`,
        };
      }
    }

    // 4. Zaktualizuj rekord w bazie (ten sam ID, zachowane powiązania)
    await app.db.query('plugin::upload.file').update({
      where: { id: fileId },
      data: {
        width: rotatedInfo.width,
        height: rotatedInfo.height,
        size: Math.round((rotatedBuffer.length / 1024) * 100) / 100,
        formats: newFormats,
        updatedAt: new Date(),
      },
    });

    console.log(`[rotate-image] Sukces! ${file.name}: ${file.width}x${file.height} -> ${rotatedInfo.width}x${rotatedInfo.height} px, rozmiar: ${(rotatedBuffer.length / 1024).toFixed(1)} KB`);
  } finally {
    await app.destroy();
  }
}

run().catch((err) => {
  console.error('[rotate-image] Błąd:', err.message);
  process.exit(1);
});
