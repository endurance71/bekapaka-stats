const getPreviewPathname = (uid, document) => {
  const slug = document?.slug
  if (!slug) return null

  switch (uid) {
    case 'api::news-post.news-post':
      return `/aktualnosci/${slug}`
    case 'api::document.document':
      return `/dokumenty/${slug}`
    default:
      return null
  }
}

module.exports = ({ env }) => {
  const clientUrl = env('CLIENT_URL', 'https://bekapaka.pl')
  const previewSecret = env('PREVIEW_SECRET', '')

  return {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
    apiToken: {
      salt: env('API_TOKEN_SALT'),
    },
    transfer: {
      token: {
        salt: env('TRANSFER_TOKEN_SALT'),
      },
    },
    secrets: {
      encryptionKey: env('ENCRYPTION_KEY'),
    },
    flags: {
      nps: env.bool('FLAG_NPS', true),
      promoteEE: env.bool('FLAG_PROMOTE_EE', true),
      docLinks: env.bool('FLAG_DOC_LINKS', true),
    },
    preview: {
      enabled: true,
      config: {
        allowedOrigins: [clientUrl, 'https://www.bekapaka.pl'],
        async handler(uid, { documentId, status }) {
          const document = await strapi.documents(uid).findOne({
            documentId,
            ...(status ? { status } : {}),
          })
          const pathname = getPreviewPathname(uid, document)
          if (!pathname || !previewSecret) return null

          const params = new URLSearchParams({
            url: pathname,
            secret: previewSecret,
            status: status || 'draft',
          })
          return `${clientUrl}/api/preview?${params}`
        },
      },
    },
  }
}
