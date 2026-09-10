import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { Reveal } from "@/components/Reveal";
import { TeamMember } from "@/components/TeamMember";
import { team } from "@/data/team";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Ekibimiz — Güneş Enerjisi Mühendisleri",
  description:
    "Projelerin arkasındaki mühendislik ekibiyle tanışın: Asır Solar'ın güneş enerjisi sistemleri mühendisleri ve iletişim bilgileri.",
  path: "/ekibimiz",
});

export default function EkibimizPage() {
  return (
    <>
      <section className="page-hero">
        <Container>
          <div className="page-hero__grid">
            <Reveal className="page-hero__title" as="div">
              <SectionLabel index="01" text="EKİP" />
              <h1 style={{ marginTop: "var(--sp-3)" }}>
                Projelerin arkasındaki mühendislik ekibi.
              </h1>
            </Reveal>
            <Reveal className="page-hero__desc" delay={100}>
              <p className="text-lg">
                Keşiften devreye almaya kadar süreci yürüten mühendisler ile
                doğrudan iletişime geçebilirsiniz.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
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
