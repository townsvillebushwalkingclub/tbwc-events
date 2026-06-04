import './poster.css'
import type { Metadata } from 'next'

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
