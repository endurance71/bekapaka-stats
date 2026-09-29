'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createStrapi } = require('@strapi/strapi');
const { processHeicFile, isHeicFile } = require('../src/utils/heic-converter');

const BREAKPOINTS = {
  large: 1000,
  medium: 750,
  small: 500,
};

const THUMBNAIL_OPTIONS = {
  width: 245,
  height: 156,
  fit: 'inside',
};

async function generateVariants(mainJpgPath, fileHash, fileName) {
  const baseName = fileName.replace(/\.(heic|heif|heics|heifs)$/i, '') + '.jpg';
  const meta = await sharp(mainJpgPath).metadata();
  const formats = {};
  const uploadDir = path.dirname(mainJpgPath);

  // 1. Thumbnail
  const thumbHash = `thumbnail_${fileHash}`;
  const thumbFile = `${thumbHash}.jpg`;
  const thumbPath = path.join(uploadDir, thumbFile);
  const thumbInfo = await sharp(mainJpgPath)
    .resize(THUMBNAIL_OPTIONS)
    .jpeg({ quality: 85 })
    .toFile(thumbPath);

  formats.thumbnail = {
    name: `thumbnail_${baseName}`,
    hash: thumbHash,
    ext: '.jpg',
    mime: 'image/jpeg',
    path: null,
    width: thumbInfo.width,
    height: thumbInfo.height,
    size: Math.round((thumbInfo.size / 1024) * 100) / 100,
    sizeInBytes: thumbInfo.size,
    url: `/uploads/${thumbFile}`,
  };

  // 2. Breakpoints (large, medium, small)
  for (const [key, size] of Object.entries(BREAKPOINTS)) {
    if (size < (meta.width || 0) || size < (meta.height || 0)) {
      const bpHash = `${key}_${fileHash}`;
      const bpFile = `${bpHash}.jpg`;
      const bpPath = path.join(uploadDir, bpFile);
      const bpInfo = await sharp(mainJpgPath)
        .resize({ width: size, height: size, fit: 'inside' })
        .jpeg({ quality: 85 })
        .toFile(bpPath);

      formats[key] = {
        name: `${key}_${baseName}`,
        hash: bpHash,
        ext: '.jpg',
        mime: 'image/jpeg',
        path: null,
        width: bpInfo.width,
        height: bpInfo.height,
        size: Math.round((bpInfo.size / 1024) * 100) / 100,
        sizeInBytes: bpInfo.size,
        url: `/uploads/${bpFile}`,
      };
    }
  }

  return formats;
}

async function run() {
  const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');
  console.log(`[migrate-heic] Starting HEIC migration (dry-run: ${isDryRun})...`);

  let app;
  try {
    app = await createStrapi().load();
  } catch (err) {
    console.error('[migrate-heic] Failed to initialize Strapi:', err);
    process.exit(1);
  }

  try {
    const uploadDir = path.resolve(app.dirs.static.public, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      throw new Error(`Uploads directory does not exist: ${uploadDir}`);
    }

    const files = await app.db.query('plugin::upload.file').findMany({
      where: {
        $or: [
          { mime: { $contains: 'heic' } },
          { mime: { $contains: 'heif' } },
          { ext: { $containsi: 'heic' } },
          { ext: { $containsi: 'heif' } },
        ],
      },
      populate: ['folder', 'related'],
    });

    console.log(`[migrate-heic] Found ${files.length} HEIC file record(s) in Media Library.`);

    let wouldConvert = 0;
    let converted = 0;
    let errors = 0;
    const errorDetails = [];

    for (const file of files) {
      const sourceName = `${file.hash}${file.ext}`;
      const sourcePath = path.join(uploadDir, sourceName);

      if (!fs.existsSync(sourcePath)) {
        console.warn(`[migrate-heic] WARNING: Source file missing on disk: ${sourcePath}`);
        errors++;
        errorDetails.push({ file: file.name, error: 'File missing on disk' });
        continue;
      }

      if (isDryRun) {
        wouldConvert++;
        console.log(`  [dry-run] Would convert: ${file.name} (${file.hash}${file.ext})`);
        continue;
      }

      // Real migration
      try {
        const newName = file.name.replace(/\.(heic|heif|heics|heifs)$/i, '') + '.jpg';
        const targetName = `${file.hash}.jpg`;
        const targetPath = path.join(uploadDir, targetName);

        // Convert source HEIC to optimized JPEG
        const result = await processHeicFile(sourcePath, targetPath);

        // Generate thumbnail and responsive formats
        const formats = await generateVariants(targetPath, file.hash, file.name);

        // Update database record
        await app.db.query('plugin::upload.file').update({
          where: { id: file.id },
          data: {
            name: newName,
            ext: '.jpg',
            mime: 'image/jpeg',
            size: Math.round((result.size / 1024) * 100) / 100,
            width: result.width,
            height: result.height,
            url: `/uploads/${targetName}`,
            formats,
            updatedAt: new Date(),
          },
        });

        // Verify that target exists and has size
        if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0) {
          // Remove old HEIC file safely
          try {
            fs.unlinkSync(sourcePath);
          } catch (unlinkErr) {
            console.warn(`[migrate-heic] Could not delete old file ${sourcePath}:`, unlinkErr.message);
          }
          converted++;
          console.log(`  [converted] ${file.name} -> ${newName} (${result.width}x${result.height}, ${(result.size / 1024).toFixed(1)} KB)`);
        } else {
          throw new Error('Target JPEG file verification failed');
        }
      } catch (err) {
        errors++;
        errorDetails.push({ file: file.name, error: err.message });
        console.error(`  [error] Failed to convert ${file.name}:`, err.message);
      }
    }

    if (isDryRun) {
      console.log('\n--- DRY RUN SUMMARY ---');
      console.log(`Found: ${files.length} HEIC files`);
      console.log(`Would convert: ${wouldConvert}`);
      console.log(`Would delete: 0`);
      console.log(`Errors: ${errors}`);
      if (errorDetails.length > 0) {
        console.log('Error details:', errorDetails);
      }
    } else {
      console.log('\n--- MIGRATION SUMMARY ---');
      console.log(`HEIC files found: ${files.length}`);
      console.log(`Converted: ${converted}`);
      console.log(`Errors: ${errors}`);
      if (errorDetails.length > 0) {
        console.log('Error details:', errorDetails);
      }
    }

    await app.destroy();
    if (errors > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('[migrate-heic] Unexpected fatal error:', err);
    if (app) await app.destroy();
    process.exit(1);
  }
}

run();
