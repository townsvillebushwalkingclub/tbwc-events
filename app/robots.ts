export default function robots() {
  const baseUrl = 'https://events.townsvillebushwalkingclub.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/poster'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
