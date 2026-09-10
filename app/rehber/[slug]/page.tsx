import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { TextLink, PrimaryButton } from "@/components/Button";
import { getGuideBySlug, guideItems } from "@/data/guides";
import { getServiceBySlug } from "@/data/services";
import { pageMetadata, siteConfig } from "@/lib/site";

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
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

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
            <Reveal className="two-col__main" as="div">
              <div className="prose">
                {guide.body.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </Reveal>

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
