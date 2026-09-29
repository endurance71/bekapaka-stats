'use strict';

module.exports = ({ strapi }) => ({
  async rotate(ctx) {
    const { fileId, angle } = ctx.request.body;

    // Validate angle
    if (angle !== 90 && angle !== -90) {
      return ctx.badRequest('Kąt obrotu musi wynosić 90 lub -90 stopni.');
    }

    // Validate fileId
    const id = parseInt(fileId, 10);
    if (!id || id <= 0) {
      return ctx.badRequest('Nieprawidłowe ID pliku.');
    }

    try {
      const result = await strapi
        .plugin('media-tools')
        .service('rotate')
        .rotateImage(id, angle, ctx.state.user);

      ctx.send({
        success: true,
        file: result,
        cacheVersion: new Date(result.updatedAt || Date.now()).getTime(),
      });
    } catch (err) {
      strapi.log.error('[media-tools] Rotate failed:', err);
      if (/not found|nie znalezion/i.test(err.message)) {
        return ctx.notFound(err.message);
      }
      return ctx.badRequest(err.message || 'Nie udało się obrócić zdjęcia.');
    }
  },
});
