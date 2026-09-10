"use client";

import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import { company } from "@/data/company";
import { projectTypes, validateEnquiry, type Enquiry, type EnquiryErrors } from "@/lib/enquiry";

export function ContactForm({ initialProjectType = "Diğer / Bilmiyorum", available = true }: { initialProjectType?: string; available?: boolean }) {
  const [values, setValues] = useState<Enquiry>({ name: "", phone: "", email: "", company: "", projectType: initialProjectType, message: "", consent: false });
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [reference, setReference] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const submission = useRef<{ payload: string; key: string } | null>(null);
  const pending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof Enquiry>(key: K, value: Enquiry[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const nextErrors = validateEnquiry(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const firstField = Object.keys(nextErrors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${firstField}"]`)?.focus();
      return;
    }
    const payload = JSON.stringify({ ...values, website: new FormData(event.currentTarget).get("website") || "" });
    if (submission.current?.payload !== payload) submission.current = { payload, key: crypto.randomUUID() };
    pending.current = true;
    setSending(true);
    setSendError("");
    try {
      const response = await fetch("/api/talepler", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": submission.current.key }, body: payload, signal: AbortSignal.timeout(25000) });
      const result = await response.json();
      if (!response.ok || typeof result.reference !== "string") throw new Error(result.error || "Talebiniz gönderilemedi. Lütfen tekrar deneyin.");
      setReference(result.reference);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      setSendError(error instanceof Error && error.name === "Error" ? error.message : "Bağlantı tamamlanamadı. Bilgileriniz bu formda duruyor; tekrar göndererek durumu kontrol edebilirsiniz.");
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  if (!available) return <div className="form-completion"><p className="eyebrow">BİZE ULAŞIN</p><h3>Projenizi birlikte değerlendirelim.</h3><p className="form-help">Çevrim içi talep formu şu anda kullanılamıyor. Telefon veya e-posta üzerinden ekibimizle iletişim kurabilirsiniz.</p><div className="form-completion__actions"><a className="btn btn--primary" href={company.phoneHref}>{company.phoneDisplay} ↗</a><a className="text-link" href={`mailto:${company.generalEmail}`}>E-posta gönder ↗</a></div></div>;

  if (reference) return (
    <div className="form-completion" ref={resultRef} tabIndex={-1}>
      <p className="eyebrow">TALEBİNİZ KAYDEDİLDİ</p>
      <h3>Projeniz için ilk adımı attık.</h3>
      <p className="form-help">Bilgileriniz ekibimize ulaştı. İhtiyacınızı değerlendirip paylaştığınız iletişim bilgileri üzerinden size ulaşacağız.</p>
      <p className="form-help">Talep numaranız: <strong>{reference}</strong></p>
      <div className="form-completion__actions"><Link href="/" className="btn btn--primary">Ana sayfaya dön <span aria-hidden="true">↗</span></Link><a className="text-link" href={company.phoneHref}>{company.phoneDisplay}</a></div>
    </div>
  );

  return (
    <form className="form-grid" ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={sending}>
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}><label htmlFor="website">Web sitesi<input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="form-field form-field--full"><p className="eyebrow">PROJENİZİ BİRAZ TANIYALIM</p><p className="form-help">Yıldız (*) işaretli alanlar zorunludur.</p></div>
      {([
        { key: "name", label: "Ad soyad *", type: "text", autoComplete: "name", placeholder: "Adınız ve soyadınız", required: true, maxLength: 100 },
        { key: "phone", label: "Telefon *", type: "tel", autoComplete: "tel", placeholder: "05XX XXX XX XX", required: true, maxLength: 25 },
        { key: "email", label: "E-posta *", type: "email", autoComplete: "email", placeholder: "ornek@firma.com", required: true, maxLength: 254 },
        { key: "company", label: "Firma / Kurum", type: "text", autoComplete: "organization", placeholder: "Varsa firma adınız", required: false, maxLength: 150 },
      ] as const).map((field) => <div key={field.key} className={`form-field ${errors[field.key] ? "form-field--error" : ""}`}>
        <label htmlFor={field.key}>{field.label}</label>
        <input disabled={sending} id={field.key} name={field.key} type={field.type} autoComplete={field.autoComplete} placeholder={field.placeholder} required={field.required} maxLength={field.maxLength} value={values[field.key]} onChange={(event) => update(field.key, event.target.value)} aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key] ? `${field.key}-error` : undefined} />
        {errors[field.key] && <p className="form-error" id={`${field.key}-error`}>{errors[field.key]}</p>}
      </div>)}
      <div className="form-field form-field--full"><label htmlFor="projectType">Proje türü *</label><select disabled={sending} id="projectType" name="projectType" required value={values.projectType} onChange={(event) => update("projectType", event.target.value)} aria-invalid={!!errors.projectType} aria-describedby={errors.projectType ? "projectType-error" : undefined}>{projectTypes.map((type) => <option key={type}>{type}</option>)}</select>{errors.projectType && <p className="form-error" id="projectType-error">{errors.projectType}</p>}</div>
      <div className={`form-field form-field--full ${errors.message ? "form-field--error" : ""}`}><label htmlFor="message">Projeniz hakkında *</label><textarea disabled={sending} id="message" name="message" required maxLength={1500} placeholder="Projenizin konumu, yaklaşık çatı alanı veya elektrik ihtiyacınız gibi bilgileri paylaşabilirsiniz." value={values.message} onChange={(event) => update("message", event.target.value)} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : undefined} />{errors.message && <p className="form-error" id="message-error">{errors.message}</p>}</div>
      <div className="form-field form-field--full"><label className="form-check" htmlFor="consent"><input disabled={sending} id="consent" name="consent" type="checkbox" required checked={values.consent} onChange={(event) => update("consent", event.target.checked)} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "consent-error" : undefined} /><span><Link href="/kvkk" className="text-link" target="_blank" rel="noreferrer">KVKK aydınlatma metnini</Link> okudum. Bilgilerimin proje talebimin değerlendirilmesi için kullanılmasını kabul ediyorum.</span></label>{errors.consent && <p className="form-error" id="consent-error">{errors.consent}</p>}</div>
      <div className="form-field form-field--full">{sendError && <p role="alert" className="form-error">{sendError} Dilerseniz <a href={company.phoneHref}>{company.phoneDisplay}</a> numarasından bize ulaşabilirsiniz.</p>}<button type="submit" className="btn btn--primary" disabled={sending}>{sending ? "Talebiniz gönderiliyor…" : "Keşif talebini gönder"} <span className="btn__arrow" aria-hidden="true">↗</span></button><p className="form-help" style={{ marginTop: 14 }}>Talebiniz doğrudan ekibimize iletilir. Gönderim tamamlandığında talep numaranızı burada göreceksiniz.</p></div>
    </form>
  );
}
