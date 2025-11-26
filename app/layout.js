import './globals.css'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@next/third-parties/google'

export const metadata = {
    title: 'Townsville Bushwalking Club - Events Calendar',
    description:
        'Discover upcoming bushwalking events and activities with the Townsville Bushwalking Club. Join us for guided walks, hiking adventures, and outdoor experiences in North Queensland, Australia.',
    keywords: [
        'Townsville Bushwalking Club',
        'bushwalking',
        'hiking',
        'outdoor activities',
        'Townsville',
        'North Queensland',
        'walking club',
        'nature walks',
        'adventure',
    ],
    authors: [{ name: 'Townsville Bushwalking Club' }],
    creator: 'Townsville Bushwalking Club',
    publisher: 'Townsville Bushwalking Club',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL('https://events.townsvillebushwalkingclub.com'),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Townsville Bushwalking Club - Events Calendar',
        description:
            'Discover upcoming bushwalking events and activities with the Townsville Bushwalking Club. Join us for guided walks, hiking adventures, and outdoor experiences in North Queensland, Australia.',
        url: 'https://events.townsvillebushwalkingclub.com',
        siteName: 'Townsville Bushwalking Club Events',
        locale: 'en_AU',
        type: 'website',
        // Add og-image.jpg (1200x630px) to /public folder for better social sharing
        // images: [
        //     {
        //         url: '/og-image.jpg',
        //         width: 1200,
        //         height: 630,
        //         alt: 'Townsville Bushwalking Club Events',
        //     },
        // ],
    },
    twitter: {
        card: 'summary',
        title: 'Townsville Bushwalking Club - Events Calendar',
        description:
            'Discover upcoming bushwalking events and activities with the Townsville Bushwalking Club.',
        // Add og-image.jpg to /public folder and uncomment for better Twitter cards
        // images: ['/og-image.jpg'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        // Add Google Search Console verification if you have one
        // google: 'your-verification-code',
    },
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {children}
                <Analytics />
                <SpeedInsights />
            </body>
            <GoogleAnalytics gaId="G-YZJR1FQJW1" />
        </html>
    )
}
