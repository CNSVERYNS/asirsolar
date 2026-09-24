import Link from "next/link";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, siteConfig } from "@/lib/site";
import { faqSchema } from "@/lib/schema-builders";
import { organizationId } from "@/lib/structured-data";
import { roofGuideFaq, roofGuidePath, roofGuideSources, roofGuideSteps, roofGuideUpdated } from "@/data/roof-guide";

export const metadata = pageMetadata({
  title: "Çatıma Güneş Paneli Nasıl Yaptırırım? | 2026 Kurulum Rehberi",
  description: "Çatı GES için keşif, statik ve elektrik projesi, bağlantı başvurusu, kurulum ve kabul adımları. Maliyet ve amortismanı Asır Solar ile değerlendirin.",
  path: roofGuidePath, kind: "article", modifiedAt: roofGuideUpdated,
});

export default function RoofInstallationGuide() {
  return <>
    <JsonLd data={faqSchema(roofGuideFaq)} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: "Çatıma güneş paneli nasıl yaptırırım?", inLanguage: "tr-TR", dateModified: roofGuideUpdated, datePublished: roofGuideUpdated, author: { "@id": organizationId }, publisher: { "@id": organizationId }, mainEntityOfPage: `${siteConfig.url}${roofGuidePath}`, image: `${siteConfig.url}/og-image?path=${encodeURIComponent(roofGuidePath)}` }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "HowTo", name: "Çatıya güneş enerjisi sistemi yaptırma süreci", description: "Yetkili mühendislik ekipleriyle çatı GES yatırımı planlamak için dört aşama.", step: roofGuideSteps.map((step, i) => ({ "@type": "HowToStep", position: i + 1, name: step.name, text: step.text, url: `${siteConfig.url}${roofGuidePath}#adim-${i + 1}` })) }} />
    <section className="page-hero roof-guide-hero"><Container>
      <Breadcrumbs path={roofGuidePath} title="Çatı GES kurulum rehberi" />
      <p className="eyebrow">KARAR VERMEDEN ÖNCE / 2026 REHBERİ</p>
      <h1>Çatıma güneş paneli<br />nasıl yaptırırım?</h1>
      <p className="text-lg">Faturadan ilk üretime: çatınıza uygun sistemi, izin sürecini ve yatırım hesabını dört adımda planlayın.</p>
      <div className="roof-guide-actions"><Link href="/iletisim" className="btn btn--primary">Ücretsiz Keşif İste <ArrowUpRight size={18} aria-hidden="true" /></Link><Link href="/hesaplayici" className="text-link">Tasarruf Hesapla ↗</Link></div>
      <p className="guide-byline">Asır Solar mühendislik ekibi · Güncelleme: <time dateTime={roofGuideUpdated}>23 Eylül 2026</time></p>
    </Container></section>
    <section className="section section--tight"><Container>
      <div className="roof-answer"><h2>Kısa yanıt</h2><p>Çatınıza güneş paneli yaptırmak için önce tüketim ve çatı analizi yapılır. Statik ve elektrik tasarımı, ilgili kurumun bağlantı ve onay işlemleriyle birlikte tamamlanır. Uygun bulunan sistem kurulur, kabul ve sayaç işlemlerinin ardından devreye alınır. Asır Solar, Gebze merkezli ekibiyle bu süreci keşiften teslim aşamasına kadar planlar.</p></div>
      <nav className="roof-guide-nav" aria-label="Rehber içindekiler">{roofGuideSteps.map((step, i) => <a key={step.name} href={`#adim-${i + 1}`}>{String(i + 1).padStart(2, "0")} / {step.name}</a>)}<a href="#maliyet">Maliyet ve amortisman</a><a href="#sorular">Sık sorulan sorular</a></nav>
      <div className="two-col"><article className="prose two-col__main">
        {roofGuideSteps.map((step, i) => <section key={step.name} id={`adim-${i + 1}`} className="content-section roof-step"><span className="eyebrow">ADIM {i + 1}</span><h2>{step.name}</h2><p>{step.text}</p></section>)}
        <section className="content-section" id="maliyet"><h2>Çatı GES fiyatları ve amortisman: 2026’da neye bakmalı?</h2><p>Teklifleri yalnızca panel adediyle karşılaştırmayın. Güç, yıllık üretim varsayımı, inverter ve montaj sistemi, elektrik altyapısı, proje/başvuru işleri, işçilik, bakım ve garanti kapsamını aynı tabloda değerlendirin. KDV, para birimi ve geçerlilik tarihini yazılı olarak isteyin.</p><p><strong>Basit amortisman = toplam yatırım / yıllık net fayda.</strong> Net fayda, yerinde kullanılan üretimin kaçınılan elektrik maliyetiyle değerlenmesi ve yıllık bakımın düşülmesiyle hesaplanır. Finansman, vergi, tarife değişimi ve ekipman yenilemeleri ayrıca değerlendirilir.</p><p>Herkes için geçerli bir 3,5–4,5 yıl taahhüdü yoktur. Aşağıdaki hesaplayıcıyla kendi varsayımlarınızı değiştirin; net fayda sıfır veya negatifse geri ödeme oluşmaz.</p><Link className="btn btn--primary" href="/hesaplayici">Kendi senaryonu hesapla <ArrowUpRight size={18} aria-hidden="true" /></Link></section>
      </article><aside className="two-col__side"><div className="preparation-card"><ClipboardList size={28} aria-hidden="true" /><h2>Keşif için hazırlayın</h2><ul className="content-checklist"><li>Son 12 aylık faturalar ve varsa saatlik tüketim</li><li>Saha adresi ve çatı planı</li><li>Güvenli bir noktadan çekilmiş çatı fotoğrafları</li><li>Varsa statik proje, pano ve trafo bilgileri</li><li>Abonelik, kullanım hakkı ve işletme çalışma saatleri</li></ul><Link href="/iletisim?konu=fizibilite#contact-form" className="text-link">Ekibimizle görüşün ↗</Link></div></aside></div>
      <section id="sorular" className="content-section"><h2>Çatı GES hakkında sık sorulan sorular</h2><div className="faq-list">{roofGuideFaq.map(item => <details className="faq-item" key={item.question}><summary className="faq-item__q">{item.question}<span className="faq-item__icon" aria-hidden="true" /></summary><p className="faq-item__a">{item.answer}</p></details>)}</div></section>
      <section className="guide-sources content-section"><h2>Kaynaklar ve güncel başvuru bilgileri</h2><p>Bu rehber genel yatırım hazırlığı içindir. Tesisinizin teknik ve idari koşulları ilgili kurumla proje bazında doğrulanır.</p><ul>{roofGuideSources.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul></section>
    </Container></section>
  </>;
}
