"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Mark } from "@/components/Mark";
import { apiRequest } from "./client";

export function LoginForm({ available }: { available: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try { await apiRequest("/api/admin/giris", { method: "POST", body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) }); router.replace("/admin"); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Giriş yapılamadı."); setBusy(false); }
  }
  return <div className="crm-login">
    <div className="crm-login__story"><Link href="/" className="crm-brand"><Mark size={62} /><span>ASIR SOLAR<small>İŞ TAKİP PANELİ</small></span></Link><div><span className="crm-overline">EKİBİNİZİN ORTAK ÇALIŞMA ALANI</span><h1>Her talep bir başlangıç.<br /><em>Her adım kayıt altında.</em></h1><p>İlk görüşmeden teklif onayına kadar, müşterilerinizi ve işlerinizi tek yerden takip edin.</p></div><span className="crm-login__signature">Güneşten gelen güç, mühendislikle.</span></div>
    <div className="crm-login__form"><div className="crm-login__card"><span className="crm-overline">ASIR SOLAR / EKİP GİRİŞİ</span><h2>Tekrar hoş geldiniz.</h2><p className="crm-muted">İşlerinize kaldığınız yerden devam edin.</p>
      {!available ? <div className="crm-notice">Panel hesaplarının kurulumu henüz tamamlanmadı. Hesaplar hazır olduğunda bu ekrandan giriş yapabilirsiniz.</div> : <form onSubmit={submit}>
        <label className="crm-field">Şirket e-postanız<input name="email" type="email" autoComplete="username" placeholder="ad.soyad@asirsolar.com" required maxLength={254} /></label>
        <label className="crm-field">Parolanız<span className="crm-password"><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required maxLength={128} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Parolayı gizle" : "Parolayı göster"}>{showPassword ? "Gizle" : "Göster"}</button></span></label>
        {error && <p className="crm-error" role="alert">{error}</p>}<button className="crm-button crm-button--full" disabled={busy}>{busy ? "Giriş yapılıyor…" : "Panele giriş yap"}<span aria-hidden="true">↗</span></button>
      </form>}
      <p className="crm-login__help">Bu alan yalnızca yetkili Asır Solar ekibine açıktır.</p><Link href="/" className="crm-back">← Web sitesine dön</Link>
    </div></div>
  </div>;
}
