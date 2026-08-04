import './poster-base.css'
import './poster-theme-simple.css'
import './poster-theme-nature.css'
import type { Metadata } from 'next'

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function PosterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="poster-root">{children}</div>
}
