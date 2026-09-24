import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocalArea, localAreas, localAreaPath } from "@/data/local-areas";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InstallationProcess } from "@/components/InstallationProcess";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, siteConfig } from "@/lib/site";
import { organizationId } from "@/lib/structured-data";
export const dynamicParams = false;
type Props = { params: Promise<{ sehir: string; osb: string }> };
export function generateStaticParams() { return localAreas.map(area => ({ sehir: area.citySlug, osb: area.slug })); }
export async function generateMetadata({ params }: Props) {
  const { sehir, osb } = await params; const area = getLocalArea(sehir, osb); if (!area) notFound();
  return pageMetadata({ title: area.title, description: area.summary, path: localAreaPath(area) });
}
export default async function IndustrialAreaPage({ params }: Props) {
  const { sehir, osb } = await params; const area = getLocalArea(sehir, osb); if (!area) notFound();
  const path = localAreaPath(area);
  const contact = `/iletisim?bolge=${area.slug}#contact-form`;
  return <><JsonLd data={{ "@context": "https://schema.org", "@type": "Service", "@id": `${siteConfig.url}${path}#service`, name: area.title, description: area.summary, url: `${siteConfig.url}${path}`, serviceType: "Endüstriyel çatı GES mühendisliği ve kurulumu", provider: { "@id": organizationId }, areaServed: { "@type": "Place", name: area.name, address: { "@type": "PostalAddress", addressRegion: area.city, addressCountry: "TR" } } }} />
    <section className="page-hero"><Container><Breadcrumbs path={path} /><p className="eyebrow">{area.city} / {area.district}</p><h1>{area.title}</h1><p className="text-lg">{area.summary}</p><div className="tw:mt-8"><Link className="btn btn--primary" href={contact}>Fabrikanız için keşif isteyin <span aria-hidden="true">↗</span></Link></div></Container></section>
    <section className="section section--tight"><Container><div className="two-col"><article className="prose two-col__main"><p className="guide-byline">Asır Solar · Güncelleme: <time dateTime={area.updatedAt}>22 Eylül 2026</time></p>{area.sections.map(section => <section className="content-section" key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}<InstallationProcess path={path} /><section className="guide-sources"><h2>Bölgeye özel kaynaklar</h2><ul>{area.sources.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul><p>Güncel kapasite ve başvuru koşulları ilgili kuruluşla teyit edilir. Bu sayfa OSB ile ortaklık, yetkilendirme veya bölgede tamamlanmış proje iddiası taşımaz.</p></section></article><aside className="two-col__side"><div className="preparation-card"><h2>Keşif öncesi kontrol listesi</h2><ul className="content-checklist">{area.checklist.map(item => <li key={item}>{item}</li>)}</ul><Link className="text-link" href="/hesaplayici">Çatınız için örnek hesap yapın</Link><br /><Link className="text-link" href="/ekibimiz">Mühendislik ekibimizi tanıyın</Link></div></aside></div></Container></section></>;
}
