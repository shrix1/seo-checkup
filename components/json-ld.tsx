type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[]
}

/** Safe schema.org JSON-LD script tag */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
