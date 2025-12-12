import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/business-listing/',
          '/investor-listing/',
          '/onboarding/',
          '/callback',
          '/confirm',
          '/forgot-password',
          '/signout',
          '/signup',
          '/reset-password',
          '/studio/',
          '/studio-events/',
        ],
      },
    ],
    sitemap: 'https://rioplexbizx.com/sitemap.xml',
  }
}
