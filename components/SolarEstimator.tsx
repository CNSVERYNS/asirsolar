"use client";
import { useState } from "react";
import Link from "next/link";
import { calculateSolarEstimate, solarLocations, type SolarEstimateInput } from "@/lib/solar-estimate";
import { whatsappContact } from "@/lib/whatsapp";
const numericFields = [
  { key: "monthlyBill", label: "Aylık elektrik faturası (TL)", min: 1, max: 1e9 },
  { key: "roofArea", label: "Toplam çatı alanı (m²)", min: 1, max: 1e6 },
  { key: "unitCost", label: "Kaçınılabilir birim maliyet (TL/kWh)", min: 0.01, max: 1000 },
  { key: "costPerKwp", label: "Birim yatırım varsayımı (TL/kWp)", min: 1, max: 1e7 },
] as const;
const advancedFields = [
  { key: "usableRoofPercent", label: "Kullanılabilir çatı oranı (%)", min: 1, max: 100 },
  { key: "areaPerKwp", label: "Birim güç için alan (m²/kWp)", min: 2, max: 30 },
  { key: "selfConsumptionPercent", label: "Eş zamanlı öz tüketim (%)", min: 0, max: 100 },
  { key: "maintenancePercent", label: "Yıllık bakım / yatırım (%)", min: 0, max: 100 },
] as const;
const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });
const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
export default function SolarEstimator() {
  const [values, setValues] = useState({ monthlyBill: "", roofArea: "", location: "kocaeli", unitCost: "5", costPerKwp: "25000", usableRoofPercent: "70", areaPerKwp: "6", selfConsumptionPercent: "80", maintenancePercent: "1" });
  const input: SolarEstimateInput = { ...Object.fromEntries([...numericFields, ...advancedFields].map(field => [field.key, values[field.key].trim() === "" ? NaN : Number(values[field.key])])), location: values.location } as SolarEstimateInput;
  const result = calculateSolarEstimate(input);
  const selected = solarLocations.find(location => location.id === values.location)!;
  const summary = result ? `GES ön değerlendirmesi: ${selected.label}; çatı ${number.format(input.roofArea)} m²; aylık fatura ${money.format(input.monthlyBill)}; yaklaşık ${number.format(result.suggestedKwp)} kWp ve ${number.format(result.annualGenerationKwh)} kWh/yıl. Varsayımları saha keşfiyle doğrulamak ve teklif almak istiyorum.` : "";
  const contactHref = `/iletisim?${new URLSearchParams({ proje: "İşletme / Fabrika", mesaj: summary })}#contact-form`;
  function field(item: typeof numericFields[number] | typeof advancedFields[number]) {
    return <label className="calculator-field" key={item.key} htmlFor={`solar-${item.key}`}><span>{item.label}</span><input id={`solar-${item.key}`} name={item.key} type="number" inputMode="decimal" step="any" min={item.min} max={item.max} required value={values[item.key]} onChange={event => setValues(previous => ({ ...previous, [item.key]: event.target.value }))} /></label>;
  }
  return <div className="solar-estimator"><div className="tw:grid tw:gap-8 tw:lg:grid-cols-2">
    <div><p className="eyebrow">ÇATINIZ İÇİN İLK HESAP</p><h2>Varsayımlarınızı girin</h2><p id="estimate-assumptions">5 TL/kWh ve 25.000 TL/kWp yalnızca örnek senaryo değerleridir; güncel tarife veya Asır Solar teklifi değildir. Faturanız ve teklifinizdeki değerlerle değiştirin. Sabit bedeller bu maliyete dahil edilmemelidir.</p>
      <form aria-describedby="estimate-assumptions" onSubmit={event => event.preventDefault()}><div className="calculator-fields">{numericFields.map(field)}<label className="calculator-field" htmlFor="solar-location"><span>İl / bölge örnek noktası</span><select id="solar-location" value={values.location} onChange={event => setValues(previous => ({ ...previous, location: event.target.value }))}>{solarLocations.map(location => <option value={location.id} key={location.id}>{location.label}</option>)}</select></label></div>
      <details className="estimate-assumptions"><summary>Çatı ve tüketim varsayımlarını düzenle</summary><div className="calculator-fields">{advancedFields.map(field)}</div></details></form>
    </div>
    <section className="estimate-output" aria-labelledby="estimate-result-title"><p className="eyebrow">SAHANIZA ÖZELLEŞTİRİLECEK</p><h2 id="estimate-result-title">Ön değerlendirme</h2><div aria-live="polite" aria-atomic="true">{result ? <><p className="estimate-power">{number.format(result.suggestedKwp)} <span>kWp</span></p><p>Çatı alanı ve yıllık tüketimle sınırlanan model gücü</p><dl>
      <div><dt>Çatı alanına göre üst sınır</dt><dd>{number.format(result.roofCapacityKwp)} kWp</dd></div>
      <div><dt>Yıllık üretim tahmini</dt><dd>{number.format(result.annualGenerationKwh)} kWh</dd></div>
      <div><dt>Yerinde kullanılan enerji</dt><dd>{number.format(result.selfConsumedKwh)} kWh/yıl</dd></div>
      <div><dt>Yatırım varsayımı</dt><dd>{money.format(result.investment)}</dd></div>
      <div><dt>Bakım sonrası yıllık net fayda</dt><dd>{money.format(result.annualNetBenefit)}</dd></div>
      <div><dt>Basit amortisman</dt><dd>{result.paybackYears === null ? "Geri ödeme oluşmuyor" : `${number.format(result.paybackYears)} yıl`}</dd></div>
      <div><dt>Basit yıllık net fayda / yatırım</dt><dd>%{number.format(result.annualRoiPercent)}</dd></div>
      <div><dt>Öz tüketimle ilişkili CO₂ farkı</dt><dd>{number.format(result.avoidedOperationalCo2Tonnes)} ton/yıl</dd></div></dl></> : <p className="estimate-empty">Fatura ve çatı alanını girin. Geçerli değerlerle sonuçlar anında hesaplanır.</p>}</div>
      {result && <div className="estimate-actions"><Link className="btn btn--primary" href={contactHref}>Bu hesapla teklif iste <span aria-hidden="true">↗</span></Link>{whatsappContact && <a className="text-link" href={`https://wa.me/${whatsappContact.phone}?text=${encodeURIComponent(summary)}`} target="_blank" rel="noopener noreferrer">Hesabı WhatsApp’ta paylaş <span aria-hidden="true">↗</span></a>}</div>}
      <p className="calculator-note">Sonuçlar tarayıcınızda hesaplanır. Şebekeye satış geliri varsayılmaz. Statik ve bağlantı uygunluğu, finansman, vergi, enflasyon, tarife değişimi, ekipman yenilemesi ve üretim kaybı bu basit modele dahil değildir.</p>
    </section></div>
    <details className="estimate-method"><summary>Hesap yöntemi ve kaynaklar</summary><p>Üretim: PVGIS 5.3 / SARAH3, seçilen örnek koordinatta güney yönü, 30° eğim, binaya montaj ve %14 sistem kaybı. Bu bir il ortalaması veya çatı simülasyonu değildir. Bölge dışındaki ya da farklı yön/eğimdeki sahalar için ayrı çalışma gerekir.</p><p>Güç = kullanılabilir alan / m²-kWp, en fazla yıllık tüketim / özgül üretim. Tasarruf = eş zamanlı kullanılan enerji × kaçınılabilir birim maliyet. Amortisman = yatırım / yıllık net fayda.</p><p>CO₂ farkı, öz tüketilen enerji × 0,465 kg CO₂/kWh üzerinden gösterilir; ETKB 2023 dağıtım bağlantılı tüketim faktörüdür. Yaşam döngüsü hesabı, doğrulanmış azaltım veya karbon kredisi değildir.</p><a className="text-link" href={selected.source} target="_blank" rel="noopener noreferrer">Seçilen noktanın PVGIS çıktısı</a><br /><a className="text-link" href="https://enerji.gov.tr/evced-cevre-ve-iklim-elektrik-uretim-tuketim-emisyon-faktorleri" target="_blank" rel="noopener noreferrer">ETKB emisyon faktörleri</a></details>
  </div>;
}
