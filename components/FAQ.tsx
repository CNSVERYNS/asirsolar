import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { Reveal } from "@/components/Reveal";
import { TextLink } from "@/components/Button";
import { faqItems } from "@/data/faq";

// Native <details>/<summary> — the Q&A text is real DOM content (not
// hidden-until-JS), which is what Google's FAQPage rich-result guidelines
// and AI answer engines both need to read and cite it correctly. The
// FAQPage JSON-LD below is generated from the exact same data, so the
// structured data can never drift from what's visibly on the page.
export function FAQ({ index = "07" }: { index?: string }) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section className="section section--surface" id="sikca-sorulan-sorular">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Container>
        <Reveal>
          <SectionLabel index={index} text="SIKÇA SORULAN SORULAR" />
        </Reveal>
        <Reveal delay={60}>
          <h2 style={{ marginTop: "var(--sp-3)", marginBottom: "var(--sp-6)" }}>
            Güneş paneli kurulumu hakkında merak edilenler.
          </h2>
        </Reveal>
        <div className="faq-list">
          {faqItems.map((item, i) => (
            <Reveal key={item.question} delay={i * 30} as="div">
              <details className="faq-item">
                <summary className="faq-item__q">
                  {item.question}
                  <span className="faq-item__icon" aria-hidden="true" />
                </summary>
                <p className="faq-item__a">{item.answer}</p>
                {item.guideSlug && (
                  <TextLink href={`/rehber/${item.guideSlug}`} className="faq-item__more">
                    Detaylı bilgi
                  </TextLink>
                )}
              </details>
            </Reveal>
          ))}
        </div>
        <div style={{ marginTop: "var(--sp-5)" }}>
          <Reveal delay={faqItems.length * 30} as="div">
            <TextLink href="/rehber">Daha fazla soru için Rehber&apos;e bakın</TextLink>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
