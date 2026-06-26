import Link from 'next/link'
import SiteFooter from '@/app/components/SiteFooter'

export default function NotFound() {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 md:px-8 py-4 md:py-8 max-w-4xl">
        <div className="py-16 text-center text-gray-900">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-6">
            The page you are looking for does not exist.
          </p>
          <Link
            href="/"
            className="bg-casper-orange hover:bg-casper-orange-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
          >
            Back to Events
          </Link>
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}
