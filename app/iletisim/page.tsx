import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { databaseConfigured } from "@/lib/crm/config";
import { company } from "@/data/company";
import { pageMetadata, siteConfig } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { organizationId, websiteId } from "@/lib/structured-data";
import { resolveProjectType } from "@/lib/enquiry";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { whatsappContact } from "@/lib/whatsapp";

export const metadata: Metadata = pageMetadata({
  title: "İletişim — Ücretsiz Keşif Talep Edin",
  description:
    "Güneş paneli kurulumu için Asır Solar'a ulaşın: adres, telefon, e-posta ve ücretsiz keşif talep formu. Gebze / Kocaeli.",
  path: "/iletisim",
});

export default async function IletisimPage({ searchParams }: { searchParams: Promise<{ proje?: string | string[] }> }) {
  const initialProjectType = resolveProjectType((await searchParams).proje);
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ContactPage", "@id": `${siteConfig.url}/iletisim#page`, url: `${siteConfig.url}/iletisim`, name: "Asır Solar iletişim ve keşif", mainEntity: { "@id": organizationId }, isPartOf: { "@id": websiteId } }} />
      <section className="page-hero">
        <Container>
          <div className="page-hero__grid">
            <Reveal className="page-hero__title" as="div">
              <SectionLabel index="01" text="İLETİŞİM" />
              <h1 style={{ marginTop: "var(--sp-3)" }}>
                Güzel bir başlangıç:<br />ücretsiz keşif.
              </h1>
            </Reveal>
            <Reveal className="page-hero__desc" delay={100}>
              <p className="text-lg">
                İhtiyacınızı birlikte değerlendirelim. Proje bilgilerinizi form üzerinden bize iletin veya doğrudan ekibimizi arayın.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="two-col">
            <Reveal className="two-col__main">
              <div id="contact-form"><ContactForm key={initialProjectType} initialProjectType={initialProjectType} available={databaseConfigured()} /></div>
            </Reveal>

            <Reveal className="two-col__side" delay={80}>
              <div className="info-list">
                <div className="info-row">
                  <span className="label" style={{ marginBottom: 0 }}>
                    Adres
                  </span>
                  <a
                    href={company.address.mapsHref}
                    target="_blank"
                    rel="noreferrer"
                    className="text-link"
                    style={{ border: "none" }}
                  >
                    {company.address.full}
                  </a>
                </div>
                <div className="info-row">
                  <span className="label" style={{ marginBottom: 0 }}>
                    Telefon
                  </span>
                  <a href={company.phoneHref} className="text-link" style={{ border: "none" }}>
                    {company.phoneDisplay}
                  </a>
                </div>
                <div className="info-row">
                  <span className="label" style={{ marginBottom: 0 }}>
                    E-posta
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {company.emails.map((e) => (
                      <a key={e.email} href={`mailto:${e.email}`} className="text-link" style={{ border: "none" }}>
                        {e.name} — {e.email}
                      </a>
                    ))}
                  </div>
                </div>
                {whatsappContact && <div className="info-row"><span className="label" style={{ marginBottom: 0 }}>WhatsApp</span><WhatsAppLink variant="inline" /></div>}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
