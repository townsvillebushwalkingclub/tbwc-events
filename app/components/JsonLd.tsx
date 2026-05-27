import { serializeJsonLd } from '@/lib/event-json-ld'

type JsonLdProps = {
  data: unknown
}

/** Renders JSON-LD structured data for search engines. */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
