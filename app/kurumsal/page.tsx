import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { Reveal } from "@/components/Reveal";
import { TeamMember } from "@/components/TeamMember";
import { TextLink } from "@/components/Button";
import { Marquee } from "@/components/Marquee";
import { team } from "@/data/team";
import { galleryImages } from "@/data/gallery";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Kurumsal — Güneş Enerjisi Mühendislik Ekibimiz",
  description:
    "Asır Solar'ın çalışma yaklaşımını, mühendislik kültürünü ve güneş enerjisi sistemleri konusunda uzman ekibini tanıyın. Gebze / Kocaeli.",
  path: "/kurumsal",
});

export default function KurumsalPage() {
  return (
    <>
      <section className="page-hero">
        <Container>
          <div className="page-hero__grid">
            <Reveal className="page-hero__title" as="div">
              <SectionLabel index="01" text="KURUMSAL" />
              <h1 style={{ marginTop: "var(--sp-3)" }}>
                Sahada uygulayan bir mühendislik ve enerji şirketi.
              </h1>
            </Reveal>
            <Reveal className="page-hero__desc" delay={100}>
              <p className="text-lg">
                Asır Solar; güneş enerjisi sistemlerinin projelendirmesini,
                kurulumunu ve devreye alınmasını kendi ekibiyle yürütür.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="two-col">
            <Reveal className="two-col__main">
              <div className="prose">
                <p className="text-lg">
                  Çalışma şeklimiz, panel satmaktan önce{" "}
                  <strong>doğru boyutlandırmakla</strong> başlar. Her proje;
                  saha koşulları, tüketim profili ve mevcut elektrik
                  altyapısıyla birlikte değerlendirilir.
                </p>
                <h2>Çalışma yöntemi</h2>
                <p>
                  Keşif sonrasında hazırlanan tek hat şeması ve panel
                  yerleşim planı, uygulamanın referans dokümanı olur. Saha
                  ekibi, montajdan elektriksel testlere kadar bu plana göre
                  ilerler.
                </p>
                <p>
                  Taşıyıcı sistem, panel montajı, pano revizyonu ve devreye
                  alma; aynı ekip tarafından koordine edilir. Bu, sahada
                  ortaya çıkabilecek uyumsuzlukların projelendirme
                  aşamasında önceden görülmesini sağlar.
                </p>
                <h2>Mühendislik kültürü</h2>
                <p>
                  Sistemin verimi; panel markasından çok, doğru yerleşim,
                  doğru inverter seçimi ve düzgün uygulanmış elektrik
                  altyapısına bağlıdır. Ekibimiz teknik kararları bu
                  önceliğe göre alır.
                </p>
              </div>
            </Reveal>

            <Reveal className="two-col__side" delay={80}>
              <div style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", borderRadius: "var(--radius-sm)" }}>
                <Image
                  src="/images/stock/panel-closeup.jpg"
                  alt="Güneş paneli yüzey detayı"
                  fill
                  sizes="(max-width: 900px) 100vw, 33vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section--tight">
        <Marquee images={galleryImages} />
      </section>

      <section className="section section--surface">
        <Container>
          <div className="section-head">
            <Reveal className="section-head__label" as="div">
              <SectionLabel index="02" text="EKİP" />
            </Reveal>
            <Reveal className="section-head__title" as="div">
              <h2>Projelerin arkasındaki mühendislik ekibi.</h2>
            </Reveal>
            <Reveal className="section-head__support" delay={100}>
              <TextLink href="/iletisim">İletişime geçin</TextLink>
            </Reveal>
          </div>
          <div className="team-grid">
            {team.map((member) => (
              <TeamMember key={member.email} member={member} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
