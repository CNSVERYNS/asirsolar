"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Mark } from "@/components/Mark";
import type { AdminUser } from "@/lib/crm/types";
import { apiRequest } from "./client";

export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter();
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function logout() { setBusy(true); try { await apiRequest("/api/admin/cikis", { method: "POST" }); router.replace("/admin/giris"); router.refresh(); } catch { setError("Çıkış yapılamadı. Tekrar deneyin."); setBusy(false); } }
  return <div className="crm-shell">
    <aside className="crm-sidebar"><Link href="/admin" className="crm-brand"><Mark size={47} /><span>ASIR SOLAR<small>İŞ TAKİBİ</small></span></Link><span className="crm-nav-label">ÇALIŞMA ALANI</span><nav aria-label="Panel navigasyonu"><Link href="/admin" data-active={!pathname.endsWith("ayarlar")}><span aria-hidden="true">▤</span>Müşteri takibi</Link><Link href="/admin/ayarlar" data-active={pathname.endsWith("ayarlar")}><span aria-hidden="true">⚙</span>Hesabım ve bağlantılar</Link></nav><div className="crm-sidebar__bottom"><Link href="/" target="_blank" rel="noreferrer">Web sitesini aç <span aria-hidden="true">↗</span></Link><div className="crm-person"><span className="crm-avatar">{user.id === "onur" ? "OD" : "FC"}</span><div><strong>{user.name}</strong><small>Asır Solar ekibi</small></div></div><button type="button" onClick={logout} disabled={busy}>{busy ? "Çıkış yapılıyor…" : "Güvenli çıkış"}</button>{error && <small role="alert">{error}</small>}</div></aside>
    <div className="crm-main"><header className="crm-topbar"><span>ASIR SOLAR <span className="crm-topbar__divider">/</span> İş takip paneli</span><span className="crm-shared"><i />Ortak çalışma alanı</span></header><div className="crm-content">{children}</div></div>
  </div>;
}
