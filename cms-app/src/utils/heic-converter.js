'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const sharp = require('sharp');
const utils = require('@strapi/utils');

const { ApplicationError, PayloadTooLargeError } = utils.errors || {};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_PIXELS = 50_000_000; // 50 megapixels
const MAX_DIMENSION = 2400; // Max longest edge
const JPEG_QUALITY = 87;

// Check CLI availability once and cache
let commandCache = {};
function isCommandAvailable(cmd) {
  if (commandCache[cmd] !== undefined) return commandCache[cmd];
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    commandCache[cmd] = true;
  } catch {
    commandCache[cmd] = false;
  }
  return commandCache[cmd];
}

// Simple semaphore for concurrency limit
const CONCURRENCY_LIMIT = 2;
let runningOperations = 0;
const waitingQueue = [];

function runWithLimit(fn) {
  return new Promise((resolve, reject) => {
    const execute = async () => {
      runningOperations++;
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      } finally {
        runningOperations--;
        if (waitingQueue.length > 0) {
          const next = waitingQueue.shift();
          next();
        }
      }
    };

    if (runningOperations < CONCURRENCY_LIMIT) {
      execute();
    } else {
      waitingQueue.push(execute);
    }
  });
}

/**
 * Check if a buffer matches HEIC/HEIF magic bytes (ISOBMFF ftyp box)
 */
function isHeicBuffer(buffer) {
  if (!buffer || buffer.length < 12) return false;
  const ftyp = buffer.subarray(4, 8).toString('ascii');
  if (ftyp !== 'ftyp') return false;

  const majorBrand = buffer.subarray(8, 12).toString('ascii').toLowerCase();
  const knownBrands = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis', 'vic1'];
  if (knownBrands.includes(majorBrand)) return true;

  const maxScan = Math.min(buffer.length, 64);
  for (let i = 16; i + 4 <= maxScan; i += 4) {
    const brand = buffer.subarray(i, i + 4).toString('ascii').toLowerCase();
    if (knownBrands.includes(brand)) return true;
  }
  return false;
}

/**
 * Check if a file object or path is HEIC/HEIF
 */
function isHeicFile(file) {
  if (!file) return false;

  const filename = (file.originalFilename || file.name || file.filename || '').toLowerCase();
  const mime = (file.mimetype || file.type || file.mime || '').toLowerCase();

  const isHeicExt = /\.(heic|heif|heics|heifs)$/i.test(filename);
  const isHeicMime = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'].includes(mime);

  if (isHeicExt || isHeicMime) return true;

  const filePath = file.filepath || file.path;
  if (filePath && typeof filePath === 'string' && fs.existsSync(filePath)) {
    try {
      const fd = fs.openSync(filePath, 'r');
      const buf = Buffer.alloc(64);
      const bytesRead = fs.readSync(fd, buf, 0, 64, 0);
      fs.closeSync(fd);
      if (bytesRead >= 12 && isHeicBuffer(buf)) {
        return true;
      }
    } catch {
      // Ignore read errors
    }
  }

  return false;
}

/**
 * Decode HEIC file to a temporary standard JPEG file
 */
async function decodeHeicToTempJpeg(inputPath, tempDecodedPath) {
  // 1. Try sharp first (if prebuilt sharp has working libheif for this file)
  try {
    const sharpInstance = sharp(inputPath, {
      failOnError: false,
      limitInputPixels: MAX_PIXELS,
    });
    const meta = await sharpInstance.metadata();
    if (meta.format === 'heif' || meta.format === 'heic') {
      await sharpInstance.jpeg({ quality: 95 }).toFile(tempDecodedPath);
      if (fs.existsSync(tempDecodedPath) && fs.statSync(tempDecodedPath).size > 0) {
        return { width: meta.width, height: meta.height };
      }
    }
  } catch (err) {
    // Sharp failed, e.g. iref box security limit, fallback to CLI decoders
  }

  // 2. Fallback: heif-convert (Linux / Alpine / Docker)
  if (isCommandAvailable('heif-convert')) {
    try {
      execSync(`heif-convert --quiet "${inputPath}" "${tempDecodedPath}"`, {
        stdio: 'pipe',
        timeout: 45000,
      });
      if (fs.existsSync(tempDecodedPath) && fs.statSync(tempDecodedPath).size > 0) {
        return null;
      }
    } catch (err) {
      // heif-convert failed
    }
  }

  // 3. Fallback: sips (macOS)
  if (isCommandAvailable('sips')) {
    try {
      execSync(`sips -s format jpeg "${inputPath}" --out "${tempDecodedPath}"`, {
        stdio: 'pipe',
        timeout: 45000,
      });
      if (fs.existsSync(tempDecodedPath) && fs.statSync(tempDecodedPath).size > 0) {
        return null;
      }
    } catch (err) {
      // sips failed
    }
  }

  throw new Error('No working HEIC decoder available or file decoding failed');
}

/**
 * Convert HEIC file into web-compatible JPEG (max 2400px, EXIF auto-rotated, quality 87)
 */
async function processHeicFile(inputPath, outputPath) {
  const stat = fs.statSync(inputPath);
  if (stat.size > MAX_FILE_SIZE) {
    const AppErr = PayloadTooLargeError || ApplicationError || Error;
    throw new AppErr(`Plik przekracza dopuszczalny rozmiar (maksymalnie ${MAX_FILE_SIZE / (1024 * 1024)} MB)`);
  }

  const tempDecodedPath = path.join(
    os.tmpdir(),
    `heic-dec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  );

  try {
    const metaBefore = await decodeHeicToTempJpeg(inputPath, tempDecodedPath);

    // Get dimensions before rotate/resize if available
    let origWidth = metaBefore?.width;
    let origHeight = metaBefore?.height;
    if (!origWidth || !origHeight) {
      try {
        const decodedMeta = await sharp(tempDecodedPath, { failOnError: false }).metadata();
        origWidth = decodedMeta.width;
        origHeight = decodedMeta.height;
      } catch {
        origWidth = null;
        origHeight = null;
      }
    }

    // Auto-rotate by EXIF and resize to max 2400px
    const pipeline = sharp(tempDecodedPath, {
      failOnError: false,
      limitInputPixels: MAX_PIXELS,
    })
      .rotate() // physically auto-orient based on EXIF
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: JPEG_QUALITY,
        mozjpeg: true,
      });

    const info = await pipeline.toFile(outputPath);

    return {
      outputPath,
      width: info.width,
      height: info.height,
      size: info.size,
      origWidth,
      origHeight,
      origSize: stat.size,
    };
  } finally {
    if (fs.existsSync(tempDecodedPath)) {
      try {
        fs.unlinkSync(tempDecodedPath);
      } catch {
        // Ignore cleanup error
      }
    }
  }
}

/**
 * High-level handler for a file object from multipart/form-data upload.
 * Modifies the file in-place if it is HEIC/HEIF.
 */
async function convertUploadedFileIfHeic(file) {
  if (!isHeicFile(file)) {
    return false;
  }

  return runWithLimit(async () => {
    const originalName = file.originalFilename || file.name || 'image.heic';
    const originalPath = file.filepath || file.path;

    if (!originalPath || !fs.existsSync(originalPath)) {
      return false;
    }

    const convertedName = originalName.replace(/\.(heic|heif|heics|heifs)$/i, '') + '.jpg';
    const convertedPath = path.join(
      path.dirname(originalPath),
      `converted-${Date.now()}-${path.basename(originalPath)}.jpg`
    );

    try {
      const result = await processHeicFile(originalPath, convertedPath);

      // Remove the original temporary HEIC file
      try {
        fs.unlinkSync(originalPath);
      } catch {
        // Ignore unlink error
      }

      // Update file object properties
      file.filepath = convertedPath;
      if (file.path) file.path = convertedPath;
      file.originalFilename = convertedName;
      if (file.name) file.name = convertedName;
      file.mimetype = 'image/jpeg';
      if (file.type) file.type = 'image/jpeg';
      file.size = result.size;
      file.detectedMimeType = 'image/jpeg';
      file.ext = '.jpg';

      // Required logging format
      const origMB = (result.origSize / 1024 / 1024).toFixed(2);
      const resMB = (result.size / 1024 / 1024).toFixed(2);
      const origDimStr = result.origWidth && result.origHeight ? `${result.origWidth}x${result.origHeight}` : 'unknown';
      console.log(`[media] HEIC detected: ${originalName}`);
      console.log(`[media] converted: ${convertedName}`);
      console.log(`[media] original: ${origMB} MB`);
      console.log(`[media] result: ${resMB} MB`);
      console.log(`[media] dimensions: ${origDimStr} -> ${result.width}x${result.height}`);

      return true;
    } catch (err) {
      if (typeof strapi !== 'undefined' && strapi.log) {
        strapi.log.error(`[media] Failed to convert HEIC ${originalName}: ${err.message}`, { error: err.stack });
      } else {
        console.error(`[media] Failed to convert HEIC ${originalName}:`, err.message);
      }

      // Clean up failed converted file if created
      if (fs.existsSync(convertedPath)) {
        try {
          fs.unlinkSync(convertedPath);
        } catch {}
      }

      const AppErr = ApplicationError || Error;
      throw new AppErr(
        'Nie udało się przetworzyć zdjęcia HEIC. Plik może używać nieobsługiwanego wariantu kodowania. Spróbuj wyeksportować zdjęcie jako JPEG.'
      );
    }
  });
}

module.exports = {
  isHeicBuffer,
  isHeicFile,
  processHeicFile,
  convertUploadedFileIfHeic,
  runWithLimit,
  isCommandAvailable,
  MAX_FILE_SIZE,
  MAX_DIMENSION,
  JPEG_QUALITY,
};
