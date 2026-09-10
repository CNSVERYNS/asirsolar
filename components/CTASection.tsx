import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { PrimaryButton } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { company } from "@/data/company";

export function CTASection() {
  return (
    <section className="section section--dark section--compact section--grid-motif">
      <Container>
        <Reveal>
          <SectionLabel index="08" text="İLETİŞİM" />
        </Reveal>
        <div className="cta" style={{ marginTop: "var(--sp-4)" }}>
          <Reveal className="cta__title">
            <h2>Güneşe bir adım daha yakın.<br />İlk adımı birlikte atalım.</h2>
          </Reveal>
          <Reveal className="cta__side" delay={80}>
            <p className="cta__desc">
              Projenizin kapsamını paylaşın. Ekibimiz ihtiyaçlarınızı
              değerlendirerek sizinle iletişime geçsin.
            </p>
            <div className="cta__actions">
              <PrimaryButton href="/iletisim">Ücretsiz keşif talep edin</PrimaryButton>
              <a href={company.phoneHref} className="btn btn--outline">
                {company.phoneDisplay}
              </a>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
