import './globals.css'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import type { Metadata } from 'next'


export const metadata: Metadata = {
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
  // Canonical is set per-route (homepage and events pages) to avoid wrong defaults.
  openGraph: {
    title: 'Townsville Bushwalking Club - Events Calendar',
    description:
      'Discover upcoming bushwalking events and activities with the Townsville Bushwalking Club. Join us for guided walks, hiking adventures, and outdoor experiences in North Queensland, Australia.',
    url: 'https://events.townsvillebushwalkingclub.com',
    siteName: 'Townsville Bushwalking Club Events',
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Townsville Bushwalking Club - Events Calendar',
    description:
      'Discover upcoming bushwalking events and activities with the Townsville Bushwalking Club.',
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
  verification: {},
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isProduction = process.env.NODE_ENV === 'production'
  return (
    <html lang="en">
      <body>
        {children}
        <GoogleAnalytics gaId="G-YZJR1FQJW1" />
        {isProduction && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  )
}
