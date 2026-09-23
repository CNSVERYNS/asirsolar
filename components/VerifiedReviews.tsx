import { verifiedReviews } from "@/data/business-evidence";
import { reviewProperties } from "@/lib/schema-builders";
import { organizationId } from "@/lib/structured-data";
import { company } from "@/data/company";
import { JsonLd } from "./JsonLd";
export function VerifiedReviews() {
  if (!verifiedReviews.length) return null;
  const properties = reviewProperties(verifiedReviews);
  return <section className="section container"><h2>Müşterilerimizin deneyimleri</h2><JsonLd data={{ "@context": "https://schema.org", "@type": "LocalBusiness", "@id": organizationId, name: company.brandName, ...properties }} /><div className="tw:grid tw:gap-6 tw:md:grid-cols-2">{verifiedReviews.map(review => <figure key={review.id} id={`yorum-${review.id}`}><blockquote><p>{review.text}</p></blockquote><figcaption>{review.customerName} · {review.rating}/5 · <time dateTime={review.date}>{review.date}</time></figcaption></figure>)}</div></section>;
}
