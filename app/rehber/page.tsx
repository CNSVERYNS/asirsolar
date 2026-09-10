import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { Reveal } from "@/components/Reveal";
import { guideItems, type GuideCategory } from "@/data/guides";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Rehber — Güneş Enerjisi Hakkında Sık Sorulan Sorular",
  description:
    "Güneş paneli kurulumu, çatı uygunluğu, bağlantı başvurusu ve bakım rehberi. Kendi varsayımlarınızla basit geri ödeme süresini hesaplayın.",
  path: "/rehber",
});

const categories: GuideCategory[] = [
  "Temel Bilgiler",
  "Teknik",
  "Ekipman ve Teknoloji",
  "Planlama ve Kurulum",
  "İleri Projelendirme",
  "Mevzuat ve Şebeke Bağlantısı",
  "Depolama ve Şebeke Bağımsızlığı",
  "Maliyet ve Bakım",
  "İzleme ve Performans",
  "Ticari ve Endüstriyel Uygulamalar",
  "Karar ve Genel",
];

export default function RehberPage() {
  return (
    <>
      <section className="page-hero">
        <Container>
          <div className="page-hero__grid">
            <Reveal className="page-hero__title" as="div">
              <SectionLabel index="01" text="REHBER" />
              <h1 style={{ marginTop: "var(--sp-3)" }}>
                Güneş enerjisi hakkında en çok sorulan sorular.
              </h1>
            </Reveal>
            <Reveal className="page-hero__desc" delay={100}>
              <p className="text-lg">
                Kurulum sürecinden mevzuata, maliyeti belirleyen etkenlerden
                bakıma kadar {guideItems.length} soruya yanıt bulun. Çatı uygunluğunu değerlendirin,
                bağlantı sürecini inceleyin ve kendi değerlerinizle geri ödeme hesabı yapın.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <Container>
          {categories.map((category, ci) => {
            const items = guideItems.filter((g) => g.category === category);
            return (
              <div
                key={category}
                style={{ marginBottom: ci === categories.length - 1 ? 0 : "var(--sp-8)" }}
              >
                <Reveal as="div">
                  <SectionLabel
                    index={String(ci + 1).padStart(2, "0")}
                    text={category.toLocaleUpperCase("tr-TR")}
                  />
                </Reveal>
                <div className="guide-list">
                  {items.map((item, i) => (
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
            );
          })}
        </Container>
      </section>
    </>
  );
}
