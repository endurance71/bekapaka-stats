'use strict';

const { convertUploadedFileIfHeic } = require('../../utils/heic-converter');

module.exports = (plugin) => {
  // 1. Wrap upload service
  if (plugin.services && plugin.services.upload) {
    const originalUpload = plugin.services.upload.upload;
    plugin.services.upload.upload = async function (dataAndFiles, opts) {
      if (dataAndFiles && dataAndFiles.files) {
        const fileList = Array.isArray(dataAndFiles.files) ? dataAndFiles.files : [dataAndFiles.files];
        for (const file of fileList) {
          await convertUploadedFileIfHeic(file);
        }
      }
      return originalUpload.call(this, dataAndFiles, opts);
    };

    const originalReplace = plugin.services.upload.replace;
    plugin.services.upload.replace = async function (id, dataAndFile, opts) {
      if (dataAndFile && dataAndFile.file) {
        await convertUploadedFileIfHeic(dataAndFile.file);
      }
      return originalReplace.call(this, id, dataAndFile, opts);
    };
  }

  // 2. Wrap admin-upload controller (for defense-in-depth before mimeValidation runs)
  if (plugin.controllers && plugin.controllers['admin-upload']) {
    const originalUploadFiles = plugin.controllers['admin-upload'].uploadFiles;
    if (typeof originalUploadFiles === 'function') {
      plugin.controllers['admin-upload'].uploadFiles = async function (ctx) {
        if (ctx.request?.files?.files) {
          const fileList = Array.isArray(ctx.request.files.files)
            ? ctx.request.files.files
            : [ctx.request.files.files];
          for (const file of fileList) {
            await convertUploadedFileIfHeic(file);
          }
        }
        return originalUploadFiles.call(this, ctx);
      };
    }

    const originalReplaceFile = plugin.controllers['admin-upload'].replaceFile;
    if (typeof originalReplaceFile === 'function') {
      plugin.controllers['admin-upload'].replaceFile = async function (ctx) {
        const filesInput = ctx.request?.files?.files;
        if (filesInput) {
          const files = Array.isArray(filesInput) ? filesInput : [filesInput];
          for (const file of files) {
            await convertUploadedFileIfHeic(file);
          }
        }
        return originalReplaceFile.call(this, ctx);
      };
    }
  }

  return plugin;
};
