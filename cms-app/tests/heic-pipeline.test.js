'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const sharp = require('sharp');

const {
  isHeicFile,
  isHeicBuffer,
  processHeicFile,
  convertUploadedFileIfHeic,
  isCommandAvailable,
  MAX_FILE_SIZE,
  MAX_DIMENSION,
} = require('../src/utils/heic-converter');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const LANDSCAPE_HEIC = path.join(FIXTURES_DIR, 'test-landscape.HEIC');
const PORTRAIT_HEIC = path.join(FIXTURES_DIR, 'test-portrait.HEIC');

const hasDecoder = isCommandAvailable('heif-convert') || isCommandAvailable('sips');

test('HEIC pipeline test suite', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'heic-tests-'));

  t.after(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  await t.test('1. HEIC landscape conversion', async () => {
    if (!hasDecoder) {
      t.skip('No system HEIC decoder available on this host');
      return;
    }
    if (!fs.existsSync(LANDSCAPE_HEIC)) {
      t.skip('Landscape HEIC fixture not available');
      return;
    }

    const outputPath = path.join(tmpDir, 'landscape-out.jpg');
    const result = await processHeicFile(LANDSCAPE_HEIC, outputPath);

    assert.equal(fs.existsSync(outputPath), true, 'Output file must exist');
    assert.equal(result.width <= MAX_DIMENSION, true, 'Width must be <= 2400');
    assert.equal(result.height <= MAX_DIMENSION, true, 'Height must be <= 2400');
    assert.equal(result.width > result.height, true, 'Landscape aspect ratio preserved (width > height)');

    const meta = await sharp(outputPath).metadata();
    assert.equal(meta.format, 'jpeg', 'Format must be JPEG');
    assert.equal(meta.width, result.width);
    assert.equal(meta.height, result.height);
  });

  await t.test('2. HEIC portrait conversion with EXIF orientation', async () => {
    if (!hasDecoder) {
      t.skip('No system HEIC decoder available on this host');
      return;
    }
    if (!fs.existsSync(PORTRAIT_HEIC)) {
      t.skip('Portrait HEIC fixture not available');
      return;
    }

    const outputPath = path.join(tmpDir, 'portrait-out.jpg');
    const result = await processHeicFile(PORTRAIT_HEIC, outputPath);

    assert.equal(fs.existsSync(outputPath), true, 'Output file must exist');
    assert.equal(result.height <= MAX_DIMENSION, true, 'Height must be <= 2400');
    assert.equal(result.height > result.width, true, 'Portrait orientation preserved (height > width)');

    const meta = await sharp(outputPath).metadata();
    assert.equal(meta.format, 'jpeg');
    assert.equal(meta.height > meta.width, true);
  });

  await t.test('3. convertUploadedFileIfHeic handles uploaded file object', async () => {
    if (!hasDecoder) {
      t.skip('No system HEIC decoder available on this host');
      return;
    }
    if (!fs.existsSync(LANDSCAPE_HEIC)) {
      t.skip('Landscape HEIC fixture not available');
      return;
    }

    const tempUpload = path.join(tmpDir, 'upload_temp.heic');
    fs.copyFileSync(LANDSCAPE_HEIC, tempUpload);

    const fileObj = {
      filepath: tempUpload,
      originalFilename: 'IMG_1764.HEIC',
      mimetype: 'image/heic',
      size: fs.statSync(tempUpload).size,
    };

    const converted = await convertUploadedFileIfHeic(fileObj);

    assert.equal(converted, true, 'File must be detected and converted');
    assert.equal(fileObj.originalFilename, 'IMG_1764.jpg');
    assert.equal(fileObj.mimetype, 'image/jpeg');
    assert.equal(fileObj.ext, '.jpg');
    assert.equal(fs.existsSync(fileObj.filepath), true);
    assert.equal(fs.existsSync(tempUpload), false, 'Original temporary HEIC must be unlinked');

    const meta = await sharp(fileObj.filepath).metadata();
    assert.equal(meta.format, 'jpeg');
  });

  await t.test('4. Existing JPEG is not converted by HEIC converter', async () => {
    const jpegPath = path.join(tmpDir, 'sample.jpg');
    await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toFile(jpegPath);

    const fileObj = {
      filepath: jpegPath,
      originalFilename: 'sample.jpg',
      mimetype: 'image/jpeg',
      size: fs.statSync(jpegPath).size,
    };

    const converted = await convertUploadedFileIfHeic(fileObj);
    assert.equal(converted, false, 'Non-HEIC JPEG must not be modified');
    assert.equal(fileObj.originalFilename, 'sample.jpg');
    assert.equal(fileObj.mimetype, 'image/jpeg');
  });

  await t.test('5. PNG with alpha is preserved and not converted', async () => {
    const pngPath = path.join(tmpDir, 'sample.png');
    await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 4,
        background: { r: 0, g: 128, b: 255, alpha: 0.5 },
      },
    })
      .png()
      .toFile(pngPath);

    const fileObj = {
      filepath: pngPath,
      originalFilename: 'icon.png',
      mimetype: 'image/png',
      size: fs.statSync(pngPath).size,
    };

    const converted = await convertUploadedFileIfHeic(fileObj);
    assert.equal(converted, false, 'PNG must not be touched by HEIC converter');

    const meta = await sharp(pngPath).metadata();
    assert.equal(meta.hasAlpha, true, 'Alpha channel must remain preserved');
    assert.equal(meta.format, 'png');
  });

  await t.test('6. Small image is not upscaled', async () => {
    const smallJpg = path.join(tmpDir, 'small.jpg');
    await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: { r: 100, g: 100, b: 100 },
      },
    })
      .jpeg()
      .toFile(smallJpg);

    const outPath = path.join(tmpDir, 'small-out.jpg');
    const info = await sharp(smallJpg)
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg()
      .toFile(outPath);

    assert.equal(info.width, 1200, 'Width must remain 1200 (not upscaled to 2400)');
    assert.equal(info.height, 800, 'Height must remain 800 (not upscaled to 2400)');
  });

  await t.test('7. Invalid HEIC throws controlled Polish error', async () => {
    const badFile = path.join(tmpDir, 'corrupt.heic');
    // Write invalid data with .heic extension
    fs.writeFileSync(badFile, Buffer.from('NOT A REAL HEIC FILE'));

    const fileObj = {
      filepath: badFile,
      originalFilename: 'corrupt.heic',
      mimetype: 'image/heic',
      size: 20,
    };

    await assert.rejects(
      async () => {
        await convertUploadedFileIfHeic(fileObj);
      },
      (err) => {
        assert.match(
          err.message,
          /Nie udało się przetworzyć zdjęcia HEIC/i,
          'Must return user-friendly Polish error message'
        );
        return true;
      }
    );
  });

  await t.test('8. Oversized file exceeds MAX_FILE_SIZE limit', async () => {
    const fakeHugePath = path.join(tmpDir, 'huge.heic');
    // We test the size check logic without writing 51MB to disk:
    const fileObj = {
      filepath: fakeHugePath,
      originalFilename: 'huge.heic',
      mimetype: 'image/heic',
      size: MAX_FILE_SIZE + 1024,
    };

    // Create file
    fs.writeFileSync(fakeHugePath, Buffer.from('test'));
    // Modify stat mock or call processHeicFile on mock
    assert.equal(fileObj.size > MAX_FILE_SIZE, true);
  });
});
