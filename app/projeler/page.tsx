import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { Reveal } from "@/components/Reveal";
import { ProjectCard } from "@/components/ProjectCard";
import { Marquee } from "@/components/Marquee";
import { projects } from "@/data/projects";
import { galleryImages } from "@/data/gallery";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Projeler — Güneş Enerjisi Sistemleri Uygulamaları",
  description:
    "Asır Solar'ın Gebze / Kocaeli'de uyguladığı çatı ve cephe tipi güneş enerjisi sistemleri projeleri.",
  path: "/projeler",
});

export default function ProjelerPage() {
  return (
    <>
      <section className="page-hero">
        <Container>
          <div className="page-hero__grid">
            <Reveal className="page-hero__title" as="div">
              <SectionLabel index="01" text="PROJELER" />
              <h1 style={{ marginTop: "var(--sp-3)" }}>Projeler</h1>
            </Reveal>
            <Reveal className="page-hero__desc" delay={100}>
              <p className="text-lg">
                Uyguladığımız projeler; konum, sistem tipi ve kapsam
                bilgileriyle birlikte burada yer alır.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {projects.length > 0 ? (
        <section className="section">
          <Container>
            <div className="project-masonry">
              {projects.map((project, i) => (
                <Reveal key={project.slug} delay={i * 60} as="div">
                  <ProjectCard project={project} variant={i % 3 === 1 ? "tall" : "wide"} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      ) : (
        <>
          <section className="section--tight">
            <Reveal>
              <Marquee images={galleryImages} />
            </Reveal>
          </section>

          <section className="section">
            <Container>
              <Reveal className="empty-state" as="div">
                <p className="label" style={{ marginBottom: 0 }}>
                  Belgelenmiş proje kaydı yakında eklenecektir
                </p>
                <p>
                  Yukarıdaki görseller çalıştığımız sistem tiplerini
                  göstermektedir. Tamamlanan projelerimiz; konum, sistem
                  tipi, kapasite ve hizmet kapsamı bilgileriyle birlikte
                  doğrulandıkça bu sayfaya eklenecektir.
                </p>
              </Reveal>
            </Container>
          </section>
        </>
      )}
    </>
  );
}
