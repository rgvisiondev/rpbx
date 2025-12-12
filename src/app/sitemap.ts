import { MetadataRoute } from 'next'
import { blogClient, eventClient } from '@/sanity/client'
import { groq } from 'next-sanity'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://rioplexbizx.com'

  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/business',
    '/investor',
    '/blog',
    '/events',
    '/pricing',
    '/login',
    '/signup',
    '/faq',
    '/support',
    '/terms',
    '/privacy',
    '/cookies',
    '/languages',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Fetch blog posts from Sanity
  const blogPosts = await blogClient.fetch<Array<{ slug: string; _updatedAt: string }>>(
    groq`*[_type == "post" && defined(slug.current)]{
      "slug": slug.current,
      _updatedAt
    }`
  ).catch(() => [])

  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post._updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Fetch events from Sanity
  const events = await eventClient.fetch<Array<{ slug: string; _updatedAt: string }>>(
    groq`*[_type == "event" && defined(slug.current)]{
      "slug": slug.current,
      _updatedAt
    }`
  ).catch(() => [])

  const eventRoutes = events.map((event) => ({
    url: `${baseUrl}/events/${event.slug}`,
    lastModified: new Date(event._updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...blogRoutes, ...eventRoutes]
}
