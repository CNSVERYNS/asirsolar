import type { Metadata } from "next";
import { cache } from "react";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { Reveal } from "@/components/Reveal";
import { LiveProjects } from "@/components/LiveProjects";
import { listProjects } from "@/lib/projects/repository";
import type { ManagedProject } from "@/lib/projects/types";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";
const loadProjects = cache(async () => {
  try { return { projects: await listProjects(), unavailable: false }; }
  catch { return { projects: [] as ManagedProject[], unavailable: true }; }
});
export async function generateMetadata(): Promise<Metadata> {
  const { projects } = await loadProjects();
  return { ...pageMetadata({ title: "Projeler — Güneş Enerjisi Sistemleri Uygulamaları", description: "Asır Solar güncel güneş enerjisi projeleri, saha görselleri, uygulama detayları ve proje takvimleri.", path: "/projeler" }), ...(projects.length ? {} : { robots: { index: false, follow: true } }) };
}

export default async function ProjelerPage() {
  const { projects, unavailable } = await loadProjects();
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
                Güneşten aldığımız gücü sahaya taşıyoruz. Projelerimizin detaylarını, görsellerini ve uygulama takvimlerini keşfedin.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section--tight"><Container><LiveProjects initialProjects={projects} unavailable={unavailable} /></Container></section>
    </>
  );
}
