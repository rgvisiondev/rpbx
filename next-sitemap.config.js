/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://rioplexbizx.com',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: [
    '/api/*',
    '/server-sitemap.xml',
    '/callback',
    '/confirm',
    '/forgot-password',
    '/signout',
    '/signup',
    '/dashboard/*',
    '/business-listing/*',
    '/investor-listing/*',
    '/onboarding/*',
    '/studio/*',
    '/studio-events/*',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/business-listing/',
          '/investor-listing/',
          '/onboarding/',
        ],
      },
    ],
    additionalSitemaps: [
      'https://rioplexbizx.com/sitemap.xml',
    ],
  },
};
