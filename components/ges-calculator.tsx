"use client";
import { useId } from "react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Banknote, Leaf, RotateCcw, Sun, Zap } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { gesCalculatorDefaults, gesCalculatorSchema, calculateGesScenario, type GesCalculatorValues } from "@/lib/ges-calculator";
import { solarLocations } from "@/lib/solar-estimate";
import { estimateContactHref } from "@/lib/enquiry-context";
import { whatsappContact } from "@/lib/whatsapp";

const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });
const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const adjustable = [
  { key: "unitCost", label: "Kaçınılabilir elektrik maliyeti (TL/kWh)", min: 0.01, max: 1000 },
  { key: "costPerKwp", label: "Birim yatırım varsayımı (TL/kWp)", min: 1, max: 1e7 },
  { key: "usableRoofPercent", label: "Kullanılabilir çatı (%)", min: 1, max: 100 },
  { key: "areaPerKwp", label: "Birim güç için alan (m²/kWp)", min: 2, max: 30 },
  { key: "selfConsumptionPercent", label: "Eş zamanlı öz tüketim (%)", min: 0, max: 100 },
  { key: "maintenancePercent", label: "Yıllık bakım / yatırım (%)", min: 0, max: 100 },
] as const;

export default function GesCalculator() {
  const id = useId();
  const reducedMotion = useReducedMotion();
  const { control, register, reset, formState: { errors } } = useForm<GesCalculatorValues>({ resolver: zodResolver(gesCalculatorSchema), defaultValues: gesCalculatorDefaults, mode: "onChange" });
  const values = useWatch({ control }) as GesCalculatorValues;
  const result = calculateGesScenario(values);
  const location = solarLocations.find(item => item.id === values.location);
  const summary = result && location ? `Asır Solar GES ön değerlendirmesi: ${location.label}; çatı ${number.format(values.roofArea)} m²; aylık fatura ${money.format(values.monthlyBill)}; yaklaşık ${number.format(result.suggestedKwp)} kWp; yıllık üretim ${number.format(result.annualGenerationKwh)} kWh; bakım sonrası yıllık net fayda ${money.format(result.annualNetBenefit)}; basit amortisman ${result.paybackYears === null ? "oluşmuyor" : `${number.format(result.paybackYears)} yıl`}. Bu varsayımları keşifle doğrulamak ve teklif almak istiyorum.` : "";

  return <div className="ges-calculator" data-testid="ges-calculator">
    <div className="ges-calculator-intro"><div><p className="eyebrow">FATURADAN YATIRIM SENARYOSUNA</p><h2>Çatınızın potansiyelini hesaplayın.</h2></div><Sun size={40} strokeWidth={1.3} aria-hidden="true" /></div>
    <p id={`${id}-assumptions`}>Başlangıçtaki 5 TL/kWh ve 25.000 TL/kWp, yalnızca değiştirilebilir örnek değerlerdir. Güncel elektrik tarifesi, satış fiyatı veya getiri taahhüdü değildir.</p>
    <div className="ges-calculator-grid tw:grid tw:gap-8 tw:lg:grid-cols-2">
      <form className="ges-inputs" onSubmit={event => event.preventDefault()} aria-describedby={`${id}-assumptions`} noValidate>
        {([
          { name: "monthlyBill", label: "Aylık elektrik faturası", unit: "TL", min: 100, max: 1e6, step: 100 },
          { name: "roofArea", label: "Toplam çatı alanı", unit: "m²", min: 10, max: 1e5, step: 10 },
        ] as const).map(item => <Controller name={item.name} control={control} key={item.name} render={({ field, fieldState }) => <div className="ges-range-field">
          <div className="ges-range-heading"><label htmlFor={`${id}-${item.name}`}>{item.label}</label><span>{item.unit}</span></div>
          <input {...field} id={`${id}-${item.name}`} type="number" min={item.min} max={item.max} step="any" value={Number.isFinite(field.value) ? field.value : ""} onChange={event => field.onChange(event.target.value === "" ? NaN : Number(event.target.value))} aria-invalid={fieldState.invalid} aria-describedby={fieldState.invalid ? `${id}-${item.name}-error` : undefined} />
          <Slider label={`${item.label} (${item.unit})`} min={item.min} max={item.max} step={item.step} value={[Math.min(item.max, Math.max(item.min, Number.isFinite(field.value) ? field.value : item.min))]} onValueChange={([value]) => field.onChange(value)} onValueCommit={field.onBlur} />
          <div className="ges-range-limits"><span>{number.format(item.min)} {item.unit}</span><span>{number.format(item.max)} {item.unit}</span></div>
          {fieldState.invalid && <p className="form-error" id={`${id}-${item.name}-error`}>{number.format(item.min)}–{number.format(item.max)} arasında bir değer girin.</p>}
        </div>} />)}
        <label className="ges-field" htmlFor={`${id}-location`}>İl / bölge örnek noktası<select id={`${id}-location`} {...register("location")}>{solarLocations.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <details className="estimate-assumptions"><summary>Maliyet ve üretim varsayımlarını değiştir</summary><div className="ges-advanced-grid">{adjustable.map(item => <label className="ges-field" key={item.key} htmlFor={`${id}-${item.key}`}>{item.label}<input id={`${id}-${item.key}`} type="number" min={item.min} max={item.max} step="any" {...register(item.key, { valueAsNumber: true })} aria-invalid={!!errors[item.key]} />{errors[item.key] && <span className="form-error">{item.min}–{item.max} aralığında geçerli bir değer girin.</span>}</label>)}</div></details>
        <Button variant="outline" onClick={() => reset(gesCalculatorDefaults)}><RotateCcw size={16} aria-hidden="true" /> Örnek değerleri sıfırla</Button>
      </form>
      <motion.section className="ges-results" aria-labelledby={`${id}-result`} initial={false} animate={{ opacity: result ? 1 : 0.85 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
        <p className="eyebrow">SİZİN SENARYONUZ</p><h3 id={`${id}-result`}>Ön değerlendirme</h3>
        <div aria-live="polite" aria-atomic="true">{result ? <>
          <p className="ges-power"><span>{number.format(result.suggestedKwp)}</span> kWp</p><p>Çatı alanı ve yıllık tüketimle sınırlanan model gücü</p>
          <dl className="ges-results-list"><div><dt><Zap size={18} aria-hidden="true" /> Yıllık üretim</dt><dd>{number.format(result.annualGenerationKwh)} kWh</dd></div><div><dt><Banknote size={18} aria-hidden="true" /> Yıllık finansal tasarruf</dt><dd>{money.format(result.annualSavings)}</dd></div><div><dt>Bakım sonrası yıllık net fayda</dt><dd>{money.format(result.annualNetBenefit)}</dd></div><div><dt>Yatırım varsayımı</dt><dd>{money.format(result.investment)}</dd></div><div className="ges-payback"><dt>Basit amortisman</dt><dd>{result.paybackYears === null ? "Geri ödeme oluşmuyor" : `${number.format(result.paybackYears)} yıl`}</dd></div><div><dt><Leaf size={18} aria-hidden="true" /> Öz tüketimle ilişkili CO₂ farkı</dt><dd>{number.format(result.avoidedOperationalCo2Tonnes)} ton/yıl</dd></div></dl>
        </> : <p className="ges-invalid" role="status">Sonuç için tüm alanlara geçerli değerler girin. Maliyet ve üretim varsayımlarını da kontrol edin.</p>}</div>
        {result && <div className="ges-result-actions">{whatsappContact && <a className="btn ges-whatsapp" href={`https://wa.me/${whatsappContact.phone}?text=${encodeURIComponent(summary)}`} target="_blank" rel="noopener noreferrer">Bu hesapla WhatsApp’tan teklif al <ArrowUpRight size={18} aria-hidden="true" /></a>}<Link className="text-link" href={estimateContactHref(values.location, values.roofArea, values.monthlyBill, result.suggestedKwp, result.annualGenerationKwh)}>Hesabı keşif formuna aktar ↗</Link></div>}
        <p className="calculator-note">3,5–4,5 yıl sabit bir sonuç veya garanti değildir. Şebekeye satış geliri varsayılmaz. Finansman, vergi, enflasyon, tarife değişimi, üretim kaybı ve ekipman yenilemesi dahil değildir. Teknik uygunluk keşifle doğrulanır.</p>
      </motion.section>
    </div>
    <details className="estimate-method"><summary>Hesap yöntemi ve kaynaklar</summary><p>Güç, kullanılabilir çatı alanının m²/kWp varsayımına bölünmesiyle bulunur ve yıllık tüketimi aşmayacak şekilde sınırlanır. Yıllık üretim, güç × bölge örnek noktasının özgül üretimidir. Tasarruf, eş zamanlı kullanılan üretim × kaçınılabilir elektrik maliyetidir. Amortisman, yatırım / bakım sonrası yıllık net faydadır.</p><p>Üretim modeli PVGIS 5.3 / SARAH3, güneye yönelim, 30° eğim ve %14 kayıpla seçilen koordinatı temsil eder; il ortalaması değildir. CO₂ hesabı ETKB 2023 dağıtım bağlantılı tüketim faktörü olan 0,465 kg CO₂/kWh üzerinden yapılır; karbon kredisi veya yaşam döngüsü hesabı değildir.</p>{location && <a href={location.source} target="_blank" rel="noopener noreferrer" className="text-link">PVGIS model çıktısı ↗</a>}<br /><a href="https://enerji.gov.tr/evced-cevre-ve-iklim-elektrik-uretim-tuketim-emisyon-faktorleri" target="_blank" rel="noopener noreferrer" className="text-link">ETKB emisyon faktörleri ↗</a></details>
  </div>;
}
