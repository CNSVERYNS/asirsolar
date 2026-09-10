"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatDate, formatMoney, sourceLabel, sources, stageLabel, stages, todayInTurkey, type AdminUser, type DashboardData, type LeadDetail } from "@/lib/crm/types";
import { apiRequest, ApiError } from "./client";
import { emptyDraft, LeadFields } from "./LeadFields";

function NewLeadDialog({ users, onClose }: { users: AdminUser[]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const router = useRouter();
  const [draft, setDraft] = useState(emptyDraft); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { const node = dialog.current; node?.showModal(); const overflow = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { node?.close(); document.body.style.overflow = overflow; }; }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try { const result = await apiRequest<LeadDetail>("/api/admin/talepler", { method: "POST", body: JSON.stringify(draft) }); onClose(); router.push(`/admin/talepler/${result.lead.id}`); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Kayıt oluşturulamadı."); setBusy(false); }
  }
  return <dialog className="crm-modal" ref={dialog} aria-labelledby="new-lead-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}><div className="crm-modal__heading"><div><span className="crm-overline">YENİ BİR BAŞLANGIÇ</span><h2 id="new-lead-title">Potansiyel müşteri ekle</h2></div><button type="button" className="crm-icon-button" onClick={onClose} disabled={busy} aria-label="Pencereyi kapat">✕</button></div><p className="crm-muted">Telefon, WhatsApp veya diğer kanallardan gelen görüşmeleri kaydedin.</p><form onSubmit={submit}><LeadFields draft={draft} setDraft={setDraft} users={users} disabled={busy} />{error && <p className="crm-error" role="alert">{error}</p>}<div className="crm-form-actions"><button type="button" className="crm-button crm-button--quiet" disabled={busy} onClick={onClose}>Vazgeç</button><button className="crm-button" disabled={busy}>{busy ? "Kaydediliyor…" : "Müşteriyi kaydet"}</button></div></form></dialog>;
}

export function Dashboard({ initialData, users, mailReady }: { initialData: DashboardData; users: AdminUser[]; mailReady: boolean }) {
  const router = useRouter(); const [data, setData] = useState(initialData);
  const [view, setView] = useState<"list" | "board">("list"); const [newLead, setNewLead] = useState(false);
  const [filters, setFilters] = useState({ q: "", stage: "all", source: "all", assignee: "all", archived: "false", followUp: "all", page: "1" });
  const [refresh, setRefresh] = useState(0); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const query = new URLSearchParams(filters).toString();
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setBusy(true);
      try { const result = await apiRequest<DashboardData>(`/api/admin/talepler?${query}`, { signal: controller.signal }); if (!controller.signal.aborted) { setData(result); setError(""); } }
      catch (error) { if (!controller.signal.aborted) { if (error instanceof ApiError && error.status === 401) router.replace("/admin/giris"); else setError("Kayıtlar yenilenemedi. Yenile düğmesiyle tekrar deneyebilirsiniz."); } }
      finally { if (!controller.signal.aborted) setBusy(false); }
    }
    const timer = window.setTimeout(load, 250);
    const poll = window.setInterval(() => { if (!document.hidden && !newLead) void load(); }, 30000);
    return () => { controller.abort(); window.clearTimeout(timer); window.clearInterval(poll); };
  }, [query, refresh, newLead, router]);
  const update = (field: keyof typeof filters, value: string) => setFilters({ ...filters, [field]: value, ...(field !== "page" ? { page: "1" } : {}) });
  const summary = data.summary;
  return <>
    <div className="crm-page-heading"><div><span className="crm-overline">İLK TEMASTAN TAMAMLANAN İŞE</span><h1>Müşteri takibi</h1><p className="crm-muted">Talepler, görüşmeler ve bir sonraki adım. Hepsi burada.</p></div><button className="crm-button" onClick={() => setNewLead(true)}><span aria-hidden="true">＋</span>Müşteri ekle</button></div>
    {!mailReady && <div className="crm-notice"><span aria-hidden="true">ⓘ</span> Web talepleri panele kaydedilir. E-posta bildirimleri, e-posta bağlantısı tamamlandığında etkinleşir.<Link href="/admin/ayarlar">Bağlantı durumu ↗</Link></div>}
    <div className="crm-stats" aria-label="Tüm aktif kayıtların özeti">
      {[{ label: "Toplam müşteri", value: summary.total, hint: "Arşiv dışındaki kayıtlar" }, { label: "Yeni talepler", value: summary.new, hint: "İlk görüşmeyi bekliyor" }, { label: "Teklif aşamasında", value: summary.proposals, hint: "Yanıt bekleyen teklifler" }, { label: "Onaylanan işler", value: summary.won, hint: formatMoney(summary.wonQuoteCents) }].map((stat, index) => <div className="crm-stat" key={stat.label}><span>{stat.label}<i aria-hidden="true">{["▤", "↙", "↗", "✓"][index]}</i></span><strong>{stat.value}</strong><small>{stat.hint}</small></div>)}
    </div>
    {summary.overdue > 0 && <button className="crm-followup-banner" onClick={() => setFilters({ ...filters, archived: "false", followUp: "due", page: "1" })}><span>◷ <strong>{summary.overdue} müşterinin</strong> takip zamanı geldi.</span><span>Takip listesini aç →</span></button>}
    <section className="crm-panel">
      <div className="crm-panel-heading"><div className="crm-section-tabs"><button data-active={filters.archived === "false"} onClick={() => update("archived", "false")}>Aktif kayıtlar</button><button data-active={filters.archived === "true"} onClick={() => update("archived", "true")}>Arşiv</button></div><div className="crm-view-switch" aria-label="Görünüm"><button aria-pressed={view === "list"} onClick={() => setView("list")}>☷ Liste</button><button aria-pressed={view === "board"} onClick={() => setView("board")}>▥ Aşama panosu</button></div></div>
      <div className="crm-filters"><label className="crm-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Müşteri, firma, e-posta veya telefon ara" placeholder="Müşteri, firma veya telefon ara…" value={filters.q} onChange={(event) => update("q", event.target.value)} /></label><select aria-label="Aşamaya göre filtrele" value={filters.stage} onChange={(event) => update("stage", event.target.value)}><option value="all">Tüm aşamalar</option>{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select><select aria-label="Kaynağa göre filtrele" value={filters.source} onChange={(event) => update("source", event.target.value)}><option value="all">Tüm kaynaklar</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}</select><select aria-label="Sorumluya göre filtrele" value={filters.assignee} onChange={(event) => update("assignee", event.target.value)}><option value="all">Tüm ekip</option><option value="unassigned">Atanmamış</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select><button className="crm-icon-button" aria-label="Kayıtları yenile" onClick={() => setRefresh((n) => n + 1)} disabled={busy}>↻</button></div>
      {filters.followUp === "due" && <div className="crm-active-filter">Takip zamanı gelenler<button onClick={() => update("followUp", "all")} aria-label="Takip filtresini kaldır">✕</button></div>}
      {error && <p className="crm-error crm-panel-message" role="alert">{error}</p>}
      <div aria-busy={busy}>
        {!data.leads.length ? <div className="crm-empty"><span className="crm-empty__icon" aria-hidden="true">↙</span><h2>{summary.total === 0 && filters.archived === "false" && !filters.q ? "İlk müşteriyle başlayın." : "Bu görünümde kayıt bulunamadı."}</h2><p>Web formundan gelen talepler otomatik görünür. Telefon ve WhatsApp görüşmelerinizi de buraya ekleyebilirsiniz.</p><button className="crm-button crm-button--quiet" onClick={() => setNewLead(true)}>Müşteri ekle ＋</button></div> : view === "list" ?
          <div className="crm-table-scroll"><table className="crm-table"><thead><tr><th>Müşteri / Proje</th><th>Kaynak</th><th>Aşama</th><th>Sorumlu</th><th>Sonraki takip</th><th>Teklif</th><th><span className="sr-only">Detay</span></th></tr></thead><tbody>{data.leads.map((lead) => <tr key={lead.id}><td><Link href={`/admin/talepler/${lead.id}`} className="crm-customer"><span className="crm-avatar" data-source={lead.source}>{lead.name.slice(0, 2).toLocaleUpperCase("tr-TR")}</span><span><strong>{lead.name}{lead.priority === "high" && <i className="crm-priority" title="Yüksek öncelik">!</i>}</strong><small>{lead.company || lead.projectType}</small></span></Link></td><td><span className="crm-source">{sourceLabel(lead.source)}</span></td><td><span className={`crm-badge crm-badge--${stages.find((stage) => stage.id === lead.stage)?.color}`}>{stageLabel(lead.stage)}</span></td><td><span className="crm-assignee">{lead.assigneeName || "Atanmadı"}</span></td><td><span className={lead.nextFollowUp && lead.nextFollowUp <= todayInTurkey() && !["lost", "completed"].includes(lead.stage) ? "crm-due" : "crm-muted"}>{formatDate(lead.nextFollowUp)}</span></td><td className="crm-amount">{formatMoney(lead.quoteCents)}</td><td><Link className="crm-row-link" href={`/admin/talepler/${lead.id}`} aria-label={`${lead.name} kaydını aç`}>↗</Link></td></tr>)}</tbody></table></div> :
          <div className="crm-board" tabIndex={0} aria-label="Müşterilerin aşama panosu; yatay kaydırılabilir">{stages.map((stage) => { const leads = data.leads.filter((lead) => lead.stage === stage.id); return <section className="crm-board-column" key={stage.id}><h2><span className={`crm-stage-dot crm-stage-dot--${stage.color}`} />{stage.label}<small>{leads.length}</small></h2><div>{leads.map((lead) => <Link className="crm-board-card" key={lead.id} href={`/admin/talepler/${lead.id}`}><span className="crm-board-card__source">{sourceLabel(lead.source)}{lead.priority === "high" && <span className="crm-priority">!</span>}</span><h3>{lead.name}</h3><p>{lead.company || lead.projectType}</p><strong>{formatMoney(lead.quoteCents)}</strong><div className="crm-board-card__bottom"><span>{lead.assigneeName?.split(" ")[0] || "Atanmadı"}</span><span>{lead.nextFollowUp ? formatDate(lead.nextFollowUp) : "Takip planlanmadı"}</span></div></Link>)}{!leads.length && <p className="crm-board-empty">Bu aşamada kayıt yok.</p>}</div></section>; })}</div>}
      </div>
      <div className="crm-pagination"><span role="status">{busy ? "Güncelleniyor…" : `${data.total} kayıt · Sayfa ${data.page} / ${Math.max(1, Math.ceil(data.total / data.pageSize))}`}{view === "board" && data.total > data.pageSize ? " · Pano bu sayfadaki kayıtları gösterir" : ""}</span><div><button disabled={data.page <= 1 || busy} onClick={() => update("page", String(data.page - 1))}>← Önceki</button><button disabled={data.page * data.pageSize >= data.total || busy} onClick={() => update("page", String(data.page + 1))}>Sonraki →</button></div></div>
    </section>
    <p className="crm-bottom-note">Liste 30 saniyede bir yenilenir. Müşteri kaydına girerek aşamasını ve görüşme notlarını güncelleyebilirsiniz.</p>
    {newLead && <NewLeadDialog users={users} onClose={() => setNewLead(false)} />}
  </>;
}
