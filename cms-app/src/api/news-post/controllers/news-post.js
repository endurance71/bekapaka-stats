'use strict'

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::news-post.news-post', ({ strapi }) => ({
  async incrementViews(ctx) {
    const { slug } = ctx.params
    if (!slug) {
      return ctx.badRequest('Missing slug parameter')
    }

    try {
      const decodedSlug = decodeURIComponent(slug).trim()
      await strapi.db.connection.raw(
        'UPDATE news_posts SET views = COALESCE(views, 0) + 1 WHERE slug = ?',
        [decodedSlug]
      )

      return ctx.send({ ok: true })
    } catch (err) {
      strapi.log.error('Failed to increment views for slug: ' + slug, err)
      return ctx.internalServerError('Failed to increment view counter')
    }
  },
}))
