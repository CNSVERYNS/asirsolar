import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { Reveal } from "@/components/Reveal";
import { PrimaryButton, TextLink } from "@/components/Button";
import { projects } from "@/data/projects";
import { pageMetadata } from "@/lib/site";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return pageMetadata({
    title: project.name,
    description: project.summary,
    path: `/projeler/${project.slug}`,
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <>
      <section className="page-hero">
        <Container>
          <Reveal>
            <TextLink href="/projeler" arrow="←">
              Tüm projeler
            </TextLink>
          </Reveal>
          <div className="page-hero__grid" style={{ marginTop: "var(--sp-5)" }}>
            <Reveal className="page-hero__title" as="div">
              <SectionLabel index={project.date} text={project.systemType} />
              <h1 style={{ marginTop: "var(--sp-3)" }}>{project.name}</h1>
            </Reveal>
            <Reveal className="page-hero__desc" delay={100}>
              <p className="text-lg">{project.summary}</p>
            </Reveal>
          </div>
        </Container>
      </section>

      <Reveal as="div">
        <div
          style={{
            position: "relative",
            aspectRatio: "16/9",
            maxWidth: "var(--container)",
            margin: "0 auto",
            paddingInline: "var(--gutter)",
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: "var(--radius-sm)" }}>
            <Image src={project.image} alt={project.name} fill sizes="100vw" style={{ objectFit: "cover" }} />
          </div>
        </div>
      </Reveal>

      <section className="section">
        <Container>
          <div className="two-col">
            <Reveal className="two-col__main">
              <p className="label" style={{ marginBottom: "var(--sp-3)" }}>
                Hizmet Kapsamı
              </p>
              <ul style={{ display: "flex", flexDirection: "column" }}>
                {project.scope.map((item) => (
                  <li
                    key={item}
                    style={{ borderTop: "1px solid var(--line)", padding: "14px 0" }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="two-col__side" delay={80}>
              <table className="detail-table">
                <tbody>
                  <tr>
                    <th>Lokasyon</th>
                    <td>{project.location}</td>
                  </tr>
                  <tr>
                    <th>Sistem Tipi</th>
                    <td>{project.systemType}</td>
                  </tr>
                  <tr>
                    <th>Kapasite</th>
                    <td>{project.capacity}</td>
                  </tr>
                  <tr>
                    <th>Tarih</th>
                    <td>{project.date}</td>
                  </tr>
                </tbody>
              </table>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section section--dark">
        <Container>
          <Reveal>
            <h2>Benzer bir proje mi planlıyorsunuz?</h2>
          </Reveal>
          <Reveal delay={80}>
            <div style={{ marginTop: "var(--sp-5)" }}>
              <PrimaryButton href="/iletisim">İletişime Geç</PrimaryButton>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
