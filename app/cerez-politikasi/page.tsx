import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { company } from "@/data/company";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Çerez Politikası",
    description: "Asır Solar çerez politikası.",
    path: "/cerez-politikasi",
  }),
  // Taslak niteliğinde — hukuk danışmanı onayına kadar aranabilir olmamalı.
  robots: { index: false, follow: true },
};

export default function CerezPage() {
  return (
    <section className="section" style={{ paddingTop: "var(--sp-8)" }}>
      <Container>
        <SectionLabel index="—" text="YASAL" />
        <h1 style={{ marginTop: "var(--sp-3)", marginBottom: "var(--sp-6)" }}>
          Çerez Politikası
        </h1>

        <div
          className="form-status"
          style={{ marginBottom: "var(--sp-6)", maxWidth: "72ch" }}
        >
          Bu sayfa taslak niteliğindedir. Yayına alınmadan önce bir hukuk
          danışmanı tarafından incelenmelidir.
        </div>

        <div className="prose">
          <p>
            Bu site, kullanıcı tercihini hatırlamak amacıyla sınırlı sayıda
            teknik çerez / yerel depolama kullanır.
          </p>
          <h2>Kullanılan Çerezler</h2>
          <p>
            Çerez onay tercihiniz, tarayıcınızın yerel depolama alanında
            saklanır ve yalnızca bu tercihin hatırlanması amacıyla
            kullanılır.
          </p>
          <h2>Tercihlerin Yönetimi</h2>
          <p>Yönetim panelinde oturum açan ekip üyeleri için 12 saat geçerli
            bir oturum çerezi kullanılır. Bu çerez girişin doğrulanmasını
            sağlar; reklam veya izleme amacıyla kullanılmaz. Çıkış
            yapıldığında oturum sonlandırılır.</p>
          <p>
            Tarayıcı ayarlarınız üzerinden depolanan verileri istediğiniz
            zaman silebilirsiniz. Sorularınız için{" "}
            <a href={`mailto:${company.generalEmail}`} className="text-link">
              {company.generalEmail}
            </a>{" "}
            adresinden bize ulaşabilirsiniz.
          </p>
        </div>
      </Container>
    </section>
  );
}
