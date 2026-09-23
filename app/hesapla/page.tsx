import Link from "next/link";
import { pageMetadata } from "@/lib/site";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LazySolarEstimator } from "@/components/LazySolarEstimator";
export const metadata = pageMetadata({ title: "GES Kapasite ve Amortisman Hesaplama", description: "Fatura, çatı alanı ve bölgeye göre GES gücü, yıllık üretim, basit amortisman ve CO₂ senaryosu. Varsayımları değiştirin; sahanız için keşif isteyin.", path: "/hesapla" });
export default function SolarCalculatorPage() {
  return <><section className="page-hero"><Container><Breadcrumbs path="/hesapla" /><p className="eyebrow">GES YATIRIMINI ANLAYIN</p><h1>Çatınızın potansiyeli.<br />Kendi yatırım senaryonuz.</h1><p className="text-lg">Bir güç ve geri ödeme hesabının hangi varsayımlara bağlı olduğunu görün. Sonuçları mühendislik ekibimizle birlikte sahanıza uyarlayın.</p></Container></section><section className="section section--tight"><Container><LazySolarEstimator /><div className="prose content-section"><h2>Bu hesap neyi gösterir?</h2><p>Çatı alanına göre bir güç sınırı, örnek konumun üretim modeli ve tüketiminiz üzerinden basit ekonomik senaryo sunar. Çatınızın taşıyıcılığını, şebeke bağlantı hakkını veya kesin kurulum bedelini belirlemez.</p><h2>Daha doğru değerlendirme için</h2><p>Son 12 aylık faturalarınızı, saatlik tüketim profilinizi ve çatı planını hazırlayın. Gündüz üretiminin ne kadarının aynı anda kullanıldığı, geri ödeme hesabında belirleyicidir.</p><Link className="text-link" href="/rehber/amortisman">Amortisman yöntemini ayrıntılı okuyun</Link><br /><Link className="text-link" href="/iletisim?proje=isletme">Sahanız için ücretsiz keşif isteyin</Link></div></Container></section></>;
}
