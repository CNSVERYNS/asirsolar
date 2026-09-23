import type { AggregateRating, BreadcrumbList, FAQPage, HowTo, LocalBusinessLeaf, Review, WithContext } from "schema-dts";
import { siteConfig } from "./site.ts";
import type { BusinessEvidence, VerifiedReview } from "../data/business-evidence.ts";
import { installationProcess } from "../data/installation-process.ts";

export type BreadcrumbItem = { name: string; path: string };
export function breadcrumbSchema(items: readonly BreadcrumbItem[]): WithContext<BreadcrumbList> {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({
    "@type": "ListItem", position: index + 1, name: item.name, item: new URL(item.path, siteConfig.url).href,
  })) };
}
export function faqSchema(items: readonly { question: string; answer: string }[]): WithContext<FAQPage> {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
}
export function installationSchema(path: string): WithContext<HowTo> {
  return { "@context": "https://schema.org", "@type": "HowTo", name: "Fabrikalara GES kurulum süreci nasıl işler?", description: "Bir fabrika çatısında profesyonel GES projesinin değerlendirme, uygulama ve teslim adımları.", inLanguage: "tr-TR",
    step: installationProcess.map((step, index) => ({ "@type": "HowToStep", position: index + 1, name: step.name, text: step.text, url: `${siteConfig.url}${path}#kurulum-${index + 1}` })) };
}
export function verifiedBusinessProperties(evidence: BusinessEvidence): Pick<LocalBusinessLeaf, "geo" | "openingHoursSpecification" | "priceRange" | "sameAs"> {
  const result: Pick<LocalBusinessLeaf, "geo" | "openingHoursSpecification" | "priceRange" | "sameAs"> = {};
  if (evidence.geo) {
    const { latitude, longitude } = evidence.geo;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error("Invalid verified business coordinates");
    result.geo = { "@type": "GeoCoordinates", latitude, longitude };
  }
  if (evidence.openingHours?.length) result.openingHoursSpecification = evidence.openingHours.map(hours => {
    if (!hours.days.length || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.opens) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.closes)) throw new Error("Invalid business opening hours");
    return { "@type": "OpeningHoursSpecification", dayOfWeek: hours.days, opens: hours.opens, closes: hours.closes };
  });
  if (evidence.priceRange?.trim()) result.priceRange = evidence.priceRange.trim();
  if (evidence.socialProfiles.length) result.sameAs = evidence.socialProfiles.map(value => {
    const url = new URL(value); if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid business profile URL"); return url.href;
  });
  return result;
}
export function reviewProperties(reviews: readonly VerifiedReview[]): { review?: Review[]; aggregateRating?: AggregateRating } {
  if (!reviews.length) return {};
  if (new Set(reviews.map(review => review.id)).size !== reviews.length) throw new Error("Duplicate review");
  const entries: Review[] = reviews.map(review => {
    if (!review.publicationConsent || !review.verifiedProject.trim() || !review.customerName.trim() || !review.text.trim() || !Number.isFinite(review.rating) || review.rating < 1 || review.rating > 5 || !/^\d{4}-\d{2}-\d{2}$/.test(review.date) || !Number.isFinite(Date.parse(review.date)) || new Date(review.date).toISOString().slice(0, 10) !== review.date) throw new Error("Invalid verified review");
    return { "@type": "Review", "@id": `${siteConfig.url}/kurumsal#yorum-${encodeURIComponent(review.id)}`, author: { "@type": "Person", name: review.customerName }, datePublished: review.date, reviewBody: review.text, reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 } };
  });
  return { review: entries, aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length, reviewCount: reviews.length, bestRating: 5, worstRating: 1 } };
}
