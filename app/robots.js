export default function robots() {
    const baseUrl = 'https://events.townsvillebushwalkingclub.com'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/', // Disallow API routes from being indexed
                    '/_next/', // Disallow Next.js internal files
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
