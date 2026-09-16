import type { Metadata } from "next";
import { Marquee } from "@/components/Marquee";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { Reveal } from "@/components/Reveal";
import { ServiceRow } from "@/components/ServiceRow";
import { services } from "@/data/services";
import { galleryImages } from "@/data/gallery";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Güneş Paneli Kurulumu ve GES Hizmetleri",
  description:
    "Güneş paneli kurulumu, çatı ve cephe tipi GES projelendirme, elektrik altyapısı, devreye alma ve bakım — Gebze / Kocaeli'de ücretsiz keşif ile başlayan hizmetlerimiz.",
  path: "/hizmetler",
});

export default function HizmetlerPage() {
  return (
    <>
      <section className="page-hero">
        <Container>
          <div className="page-hero__grid">
            <Reveal className="page-hero__title" as="div">
              <SectionLabel index="01" text="HİZMETLER" />
              <h1 style={{ marginTop: "var(--sp-3)" }}>Hizmetler</h1>
            </Reveal>
            <Reveal className="page-hero__desc" delay={100}>
              <p className="text-lg">
                Keşiften devreye almaya kadar güneş enerjisi sistemlerinin
                tüm sürecini kapsayan mühendislik ve uygulama hizmetleri.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <Reveal>
          <Marquee images={galleryImages} />
        </Reveal>
        <Container>
          <p className="services-gallery-caption">Görseller, hizmet ve uygulama alanlarımızı anlatan temsili görsellerdir.</p>
          <div className="service-list">
            {services.map((service, i) => (
              <Reveal key={service.slug} delay={i * 40} as="div">
                <ServiceRow service={service} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
