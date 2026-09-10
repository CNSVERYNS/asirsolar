import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/SectionLabel";
import { company } from "@/data/company";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Gizlilik Politikası",
    description: "Asır Solar gizlilik politikası.",
    path: "/gizlilik-politikasi",
  }),
  // Taslak niteliğinde — hukuk danışmanı onayına kadar aranabilir olmamalı.
  robots: { index: false, follow: true },
};

export default function GizlilikPage() {
  return (
    <section className="section" style={{ paddingTop: "var(--sp-8)" }}>
      <Container>
        <SectionLabel index="—" text="YASAL" />
        <h1 style={{ marginTop: "var(--sp-3)", marginBottom: "var(--sp-6)" }}>
          Gizlilik Politikası
        </h1>

        <div
          className="form-status"
          style={{ marginBottom: "var(--sp-6)", maxWidth: "72ch" }}
        >
          Bu sayfa taslak niteliğindedir. Yayına alınmadan önce bir hukuk
          danışmanı tarafından incelenmeli ve şirketin gerçek uygulamalarına
          göre güncellenmelidir.
        </div>

        <div className="prose">
          <p>
            {company.legalName}, bu internet sitesi üzerinden elde edilen
            bilgilerin gizliliğine önem verir. Bu politika, hangi bilgilerin
            toplandığını ve nasıl kullanıldığını açıklar.
          </p>
          <h2>Toplanan Bilgiler</h2>
          <p>
            İletişim formu üzerinden gönderdiğiniz ad soyad, telefon,
            e-posta, firma ve proje bilgileri talebinizi değerlendirmek,
            sizinle iletişim kurmak ve teklif sürecini takip etmek için
            müşteri yönetim sisteminde saklanır. Yetkili ekip üyeleri bu
            kayıtlara görüşme notu, teklif ve takip bilgisi ekleyebilir.
          </p>
          <p>Site barındırma, veri saklama ve bildirim iletimi için teknik
            hizmet sağlayıcıları kullanılır. Bu hizmetlerin ve saklama
            sürelerinin ayrıntıları şirketin veri işleme süreçlerine göre
            bu metne eklenmelidir.</p>
          <h2>Güvenlik</h2>
          <p>
            Paylaştığınız bilgilerin güvenliğini sağlamak için makul teknik
            ve idari önlemler alınır.
          </p>
          <h2>İletişim</h2>
          <p>
            Sorularınız için{" "}
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
