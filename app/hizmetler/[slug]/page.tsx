import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { Reveal } from "@/components/Reveal";
import { PrimaryButton, TextLink } from "@/components/Button";
import { getServiceBySlug, services } from "@/data/services";
import { serviceDetails } from "@/data/service-details";
import { JsonLd } from "@/components/JsonLd";
import { serviceSchema } from "@/lib/structured-data";
import { guideItems } from "@/data/guides";
import { siteConfig, pageMetadata } from "@/lib/site";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return pageMetadata({
    title: `${service.title} — Gebze, Kocaeli`,
    description: service.summary,
    path: `/hizmetler/${service.slug}`,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();
  const detail = serviceDetails[service.slug];

  const relatedGuides = guideItems
    .filter((g) => g.relatedServiceSlug === service.slug)
    .slice(0, 4);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Hizmetler", item: `${siteConfig.url}/hizmetler` },
      {
        "@type": "ListItem",
        position: 3,
        name: service.title,
        item: `${siteConfig.url}/hizmetler/${service.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={serviceSchema(service)} />
      <JsonLd data={breadcrumbJsonLd} />
      <section className="page-hero">
        <Container>
          <Reveal>
            <TextLink href="/hizmetler" arrow="←">
              Tüm hizmetler
            </TextLink>
          </Reveal>
          <div className="page-hero__grid" style={{ marginTop: "var(--sp-5)" }}>
            <Reveal className="page-hero__title" as="div">
              <SectionLabel index={service.num} text="HİZMET" />
              <h1 style={{ marginTop: "var(--sp-3)" }}>{service.title}</h1>
            </Reveal>
            <Reveal className="page-hero__desc" delay={100}>
              <p className="text-lg">{service.summary}</p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <Container>
          <Reveal>
            <div className="detail-banner">
              <Image
                src={service.image}
                alt={`${service.title} — temsili uygulama görseli`}
                fill
                sizes="(max-width: 900px) 100vw, 1280px"
                style={{ objectFit: "cover" }}
              />
            </div>
          </Reveal>

          <div className="two-col">
            <div className="two-col__main">
              <div className="prose">
                {service.description.map((paragraph) => (
                  <p key={paragraph} className="text-lg">
                    {paragraph}
                  </p>
                ))}
                {detail?.sections.map(section => (
                  <section className="content-section" key={section.title}>
                    <h2>{section.title}</h2>
                    {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                    {section.items && <ul className="content-checklist">{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
                  </section>
                ))}
              </div>
            </div>

            <Reveal className="two-col__side" delay={80}>
              <p className="label" style={{ marginBottom: "var(--sp-3)" }}>
                Kapsam
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {service.scope.map((item) => (
                  <li
                    key={item}
                    style={{
                      borderTop: "1px solid var(--line)",
                      paddingTop: "12px",
                      fontSize: "15px",
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
              {detail && <div className="preparation-card">
                <h2>Görüşme öncesi hazırlık</h2>
                <ul className="content-checklist">{detail.preparation.map(item => <li key={item}>{item}</li>)}</ul>
                <p>Gebze / Kocaeli’deki sahanızın bilgilerini paylaşın; keşif kapsamını birlikte belirleyelim.</p>
              </div>}
              <div style={{ marginTop: "var(--sp-6)" }}>
                <PrimaryButton href="/iletisim">Bu Hizmeti Görüşelim</PrimaryButton>
              </div>
            </Reveal>
          </div>

          {relatedGuides.length > 0 && (
            <div style={{ marginTop: "var(--sp-9)" }}>
              <p className="label" style={{ marginBottom: 0 }}>
                İLGİLİ SORULAR
              </p>
              <div className="guide-list">
                {relatedGuides.map((item) => (
                  <Link key={item.slug} href={`/rehber/${item.slug}`} className="guide-row">
                    <span className="guide-row__q">{item.question}</span>
                    <span className="guide-row__arrow" aria-hidden="true">
                      ↗
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
