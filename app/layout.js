import './globals.css'

export const metadata = {
    title: 'Townsville Bushwalking Club - Events Calendar',
    description:
        'Events calendar and activities for the Townsville Bushwalking Club',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
