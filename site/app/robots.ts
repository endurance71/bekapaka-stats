import type { MetadataRoute } from 'next'

const siteUrl = process.env.SITE_BASE_URL || 'https://bekapaka.pl'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: `${siteUrl}/sitemap.xml`
  }
}
