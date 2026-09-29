'use strict';

const { convertUploadedFileIfHeic } = require('../utils/heic-converter');

async function processFilesRecursive(item) {
  if (!item) return;

  if (Array.isArray(item)) {
    for (const f of item) {
      await processFilesRecursive(f);
    }
  } else if (typeof item === 'object') {
    if (item.filepath || item.path) {
      await convertUploadedFileIfHeic(item);
    } else {
      for (const key of Object.keys(item)) {
        await processFilesRecursive(item[key]);
      }
    }
  }
}

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (ctx.request && ctx.request.files) {
      await processFilesRecursive(ctx.request.files);
    }
    await next();
  };
};
