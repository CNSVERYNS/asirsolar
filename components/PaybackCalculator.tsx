"use client";

import { useState, type FormEvent } from "react";
import { calculatePayback, type PaybackInput } from "@/lib/solar-payback";

const fields: { key: keyof PaybackInput; label: string; hint: string; max?: number; positive?: boolean }[] = [
  { key: "investment", label: "Toplam yatırım (TL)", hint: "Teklifteki toplam proje bedeli.", positive: true },
  { key: "generation", label: "Yıllık üretim (kWh)", hint: "Sahanız için hesaplanan üretim tahmini.", positive: true },
  { key: "selfConsumptionPercent", label: "Üretimin yerinde kullanım oranı (%)", hint: "Üretilen enerjinin binada aynı anda kullanılan payı.", max: 100 },
  { key: "avoidedUnitCost", label: "Öz tüketim birim tasarrufu (TL/kWh)", hint: "Öz tüketim sayesinde azalan birim elektrik maliyeti." },
  { key: "exportUnitValue", label: "Şebekeye verilen enerji değeri (TL/kWh)", hint: "Koşulları doğrulanmadıysa 0 bırakın; gelir varsayılmaz." },
  { key: "annualCost", label: "Yıllık işletme ve bakım gideri (TL)", hint: "Karşılaştırmada kullanacağınız yıllık gider tahmini." },
];
const initialValues = { investment: "", generation: "", selfConsumptionPercent: "", avoidedUnitCost: "", exportUnitValue: "0", annualCost: "" };
const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });

export function PaybackCalculator() {
  const [values, setValues] = useState(initialValues);
  const [result, setResult] = useState<ReturnType<typeof calculatePayback>>(null);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const inputs = Object.fromEntries(fields.map(({ key }) => [key, values[key].trim() === "" ? NaN : Number(values[key])])) as PaybackInput;
    const calculated = calculatePayback(inputs);
    setResult(calculated);
    setError(calculated ? "" : "Tüm alanları geçerli sayılarla doldurun. Yatırım ve üretim sıfırdan büyük, kullanım oranı %0–100 arasında olmalıdır.");
  }
  return (
    <section className="payback-calculator" id="hesaplama" aria-labelledby="calculator-title">
      <p className="eyebrow">KENDİ SENARYONUZU DENEYİN</p>
      <h2 id="calculator-title">Basit geri ödeme hesabı</h2>
      <p>Tüketim profilinizi ve teklifinizdeki değerleri girin. Bilgileriniz bu hesap için tarayıcınızda işlenir.</p>
      <form onSubmit={submit}>
        <div className="calculator-fields">
          {fields.map(field => (
            <div className="calculator-field" key={field.key}>
              <label htmlFor={`calc-${field.key}`}>{field.label}</label>
              <input id={`calc-${field.key}`} type="number" inputMode="decimal" step="any" min={field.positive ? "0.01" : "0"} max={field.max} required
                aria-describedby={`hint-${field.key}`} value={values[field.key]}
                onChange={event => { setValues({ ...values, [field.key]: event.target.value }); setResult(null); setError(""); }} />
              <small id={`hint-${field.key}`}>{field.hint}</small>
            </div>
          ))}
        </div>
        <button className="btn btn--primary" type="submit">Hesapla <span aria-hidden="true">↗</span></button>
      </form>
      <div aria-live="polite" aria-atomic="true">
        {error && <p className="calculator-error" role="alert">{error}</p>}
        {result && <div className="calculator-result">
          <p className="eyebrow">GİRDİĞİNİZ VARSAYIMLARLA</p>
          <p className="calculator-result__value">{result.paybackYears !== null ? `${number.format(result.paybackYears)} yıl` : "Geri ödeme oluşmuyor"}</p>
          <p>{result.paybackYears !== null ? "Basit geri ödeme süresi" : "Yıllık net fayda sıfır veya negatif."}</p>
          <dl>
            <div><dt>Yerinde kullanılan enerji</dt><dd>{number.format(result.selfConsumed)} kWh/yıl</dd></div>
            <div><dt>Şebekeye verilen enerji</dt><dd>{number.format(result.exported)} kWh/yıl</dd></div>
            <div><dt>Öz tüketimden tasarruf</dt><dd>{money.format(result.annualSavings)}/yıl</dd></div>
            <div><dt>Varsayılan şebekeye satış değeri</dt><dd>{money.format(result.annualExportValue)}/yıl</dd></div>
            <div><dt>Giderler sonrası net fayda</dt><dd>{money.format(result.netAnnualBenefit)}/yıl</dd></div>
          </dl>
        </div>}
      </div>
      <p className="calculator-note">Sabit yıllık değerlerle ön değerlendirmedir. Finansman, vergi, enflasyon, tarife değişimi, üretim kaybı ve ekipman yenilemesini içermez. Mahsuplaşma faturası veya kesin yatırım getirisi hesaplamaz.</p>
    </section>
  );
}
