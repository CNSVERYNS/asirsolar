import { serializeJsonLd, type StructuredData } from "@/lib/json-ld";
export function JsonLd({ data }: { data: StructuredData }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
