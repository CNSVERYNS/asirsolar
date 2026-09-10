import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { company } from "@/data/company";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "KVKK Aydınlatma Metni",
    description: "Asır Solar KVKK aydınlatma metni.",
    path: "/kvkk",
  }),
  // Taslak niteliğinde — hukuk danışmanı onayına kadar aranabilir olmamalı.
  robots: { index: false, follow: true },
};

export default function KvkkPage() {
  return (
    <section className="section" style={{ paddingTop: "var(--sp-8)" }}>
      <Container>
        <SectionLabel index="—" text="YASAL" />
        <h1 style={{ marginTop: "var(--sp-3)", marginBottom: "var(--sp-6)" }}>
          KVKK Aydınlatma Metni
        </h1>

        <div
          className="form-status"
          style={{ marginBottom: "var(--sp-6)", maxWidth: "72ch" }}
        >
          Bu sayfa taslak niteliğindedir. Yayına alınmadan önce bir hukuk
          danışmanı tarafından şirketin gerçek veri işleme süreçlerine göre
          incelenmeli ve onaylanmalıdır.
        </div>

        <div className="prose">
          <p>
            {company.legalName} (&quot;Şirket&quot;) olarak, 6698 sayılı
            Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında
            veri sorumlusu sıfatıyla, tarafımıza ilettiğiniz kişisel
            verilerin işlenmesine ilişkin olarak sizi bilgilendirmek isteriz.
          </p>
          <h2>İşlenen Veriler</h2>
          <p>
            İletişim formu aracılığıyla paylaştığınız ad soyad, telefon,
            e-posta, firma bilgisi ve proje talebine ilişkin mesaj içeriği
            işlenmektedir.
          </p>
          <h2>İşleme Amacı</h2>
          <p>
            Verileriniz, talebinizin değerlendirilmesi, tarafınızla
            iletişime geçilmesi ve proje sürecinin yürütülmesi amacıyla
            işlenir.
          </p>
          <h2>Haklarınız</h2>
          <p>
            KVKK&apos;nın 11. maddesi kapsamındaki haklarınızı kullanmak için{" "}
            <a href={`mailto:${company.generalEmail}`} className="text-link">
              {company.generalEmail}
            </a>{" "}
            adresinden bizimle iletişime geçebilirsiniz.
          </p>
        </div>
      </Container>
    </section>
  );
}
