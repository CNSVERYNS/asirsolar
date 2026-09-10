import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { TextLink, PrimaryButton } from "@/components/Button";
import { getGuideBySlug, guideItems } from "@/data/guides";
import { getServiceBySlug } from "@/data/services";
import { pageMetadata, siteConfig } from "@/lib/site";
import { guideDetails } from "@/data/guide-details";
import { JsonLd } from "@/components/JsonLd";
import { PaybackCalculator } from "@/components/PaybackCalculator";
import { organizationId } from "@/lib/structured-data";

export function generateStaticParams() {
  return guideItems.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  return pageMetadata({
    title: guide.question,
    description: guide.summary,
    path: `/rehber/${guide.slug}`,
  });
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();
  const detail = guideDetails[guide.slug];

  const relatedService = getServiceBySlug(guide.relatedServiceSlug);
  const otherInCategory = guideItems
    .filter((g) => g.category === guide.category && g.slug !== guide.slug)
    .slice(0, 4);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.question,
    description: guide.summary,
    articleSection: guide.category,
    inLanguage: "tr-TR",
    url: `${siteConfig.url}/rehber/${guide.slug}`,
    mainEntityOfPage: `${siteConfig.url}/rehber/${guide.slug}`,
    publisher: { "@id": organizationId },
    author: { "@id": organizationId },
    ...(detail ? { dateModified: detail.updatedAt, citation: detail.sources.map(source => source.href) } : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Rehber", item: `${siteConfig.url}/rehber` },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.question,
        item: `${siteConfig.url}/rehber/${guide.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <section className="page-hero">
        <Container>
          <Reveal>
            <TextLink href="/rehber" arrow="←">
              Rehber
            </TextLink>
          </Reveal>
          <div className="page-hero__grid" style={{ marginTop: "var(--sp-5)" }}>
            <Reveal className="page-hero__title" as="div">
              <p className="label" style={{ marginBottom: 0 }}>
                {guide.category.toLocaleUpperCase("tr-TR")}
              </p>
              <h1 style={{ marginTop: "var(--sp-3)" }}>{guide.question}</h1>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <Container>
          <div className="two-col">
            <div className="two-col__main">
              <article className="prose">
                <p className="guide-byline"><Link href="/kurumsal">Asır Solar</Link>{detail && <> · Güncelleme: <time dateTime={detail.updatedAt}>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(detail.updatedAt))}</time></>}</p>
                {guide.body.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
                {detail?.sections.map(section => <section className="content-section" key={section.title}>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                  {section.items && <ul className="content-checklist">{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
                </section>)}
                {detail?.calculator && <PaybackCalculator />}
                {detail && <section className="guide-sources" aria-labelledby="sources-title">
                  <h2 id="sources-title">Kaynaklar ve devamı</h2>
                  <ul>{detail.sources.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer">{source.label} <span aria-hidden="true">↗</span></a></li>)}</ul>
                  <p>Başvuru koşulları için işlem tarihindeki resmî belgeleri esas alın.</p>
                </section>}
              </article>
            </div>

            <Reveal className="two-col__side" delay={80} as="div">
              {relatedService && (
                <div className="guide-cta">
                  <p className="label" style={{ marginBottom: "var(--sp-2)" }}>
                    İLGİLİ HİZMET
                  </p>
                  <p className="guide-cta__title">{relatedService.title}</p>
                  <p className="guide-cta__desc">{relatedService.summary}</p>
                  <TextLink href={`/hizmetler/${relatedService.slug}`}>
                    Hizmeti incele
                  </TextLink>
                </div>
              )}

              <div className="guide-cta" style={{ marginTop: "var(--sp-4)" }}>
                <p className="guide-cta__title">Sorunuz mu var?</p>
                <p className="guide-cta__desc">
                  Sahaya özel netleşen konular için ücretsiz keşif talep edin.
                </p>
                <PrimaryButton href="/iletisim">İletişime Geç</PrimaryButton>
              </div>
            </Reveal>
          </div>

          {otherInCategory.length > 0 && (
            <div style={{ marginTop: "var(--sp-9)" }}>
              <Reveal as="div">
                <p className="label" style={{ marginBottom: 0 }}>
                  {guide.category.toLocaleUpperCase("tr-TR")} — DİĞER SORULAR
                </p>
              </Reveal>
              <div className="guide-list">
                {otherInCategory.map((item, i) => (
                  <Reveal key={item.slug} delay={i * 30} as="div">
                    <Link href={`/rehber/${item.slug}`} className="guide-row">
                      <span className="guide-row__q">{item.question}</span>
                      <span className="guide-row__arrow" aria-hidden="true">
                        ↗
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
