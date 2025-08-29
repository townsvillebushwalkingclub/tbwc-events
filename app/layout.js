import './globals.css'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

export const metadata = {
    title: 'Townsville Bushwalking Club - Events Calendar',
    description:
        'Events calendar and activities for the Townsville Bushwalking Club',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {children}
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    )
}
