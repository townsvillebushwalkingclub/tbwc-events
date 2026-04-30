import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center text-gray-900">
        <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
        <p className="text-gray-600 mb-6">
          The event you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="bg-casper-orange hover:bg-casper-orange-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
        >
          Back to Events
        </Link>
      </div>
    </div>
  )
}
