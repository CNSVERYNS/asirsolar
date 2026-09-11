"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { formatDate, sourceLabel, stageLabel, stages, type AdminUser, type LeadDetail } from "@/lib/crm/types";
import { apiRequest, ApiError } from "./client";
import { draftFromLead, LeadFields } from "./LeadFields";
import { NotificationStatus } from "./NotificationStatus";

export function LeadWorkspace({ initialDetail, users }: { initialDetail: LeadDetail; users: AdminUser[] }) {
  const [detail, setDetail] = useState(initialDetail); const [draft, setDraft] = useState(() => draftFromLead(initialDetail.lead));
  const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [conflict, setConflict] = useState(false);
  const lead = detail.lead; const url = `/api/admin/talepler/${lead.id}`;
  function report(error: unknown) { setError(error instanceof Error ? error.message : "İşlem tamamlanamadı."); setConflict(error instanceof ApiError && error.status === 409); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError(""); setMessage("");
    try { const updated = await apiRequest<LeadDetail>(url, { method: "PATCH", body: JSON.stringify({ ...draft, action: "update", version: lead.version }) }); setDetail(updated); setDraft(draftFromLead(updated.lead)); setConflict(false); setMessage("Değişiklikler kaydedildi."); } catch (error) { report(error); } finally { setBusy(false); }
  }
  async function addNote(event: FormEvent) {
    event.preventDefault(); if (busy || !note.trim()) return; setBusy(true); setError(""); setMessage("");
    try { const updated = await apiRequest<LeadDetail>(url, { method: "PATCH", body: JSON.stringify({ action: "note", note }) }); setDetail((previous) => ({ ...previous, events: updated.events })); setNote(""); setMessage("Görüşme notu eklendi."); } catch (error) { report(error); } finally { setBusy(false); }
  }
  async function archive() {
    if (busy) return; setBusy(true); setError("");
    try { const updated = await apiRequest<LeadDetail>(url, { method: "PATCH", body: JSON.stringify({ action: "archive", archived: !lead.archivedAt, version: lead.version }) }); setDetail(updated); setDraft(draftFromLead(updated.lead)); setMessage(updated.lead.archivedAt ? "Kayıt arşive taşındı. İstediğiniz zaman geri alabilirsiniz." : "Kayıt yeniden aktif."); } catch (error) { report(error); } finally { setBusy(false); }
  }
  async function reload() {
    if (JSON.stringify(draft) !== JSON.stringify(draftFromLead(lead)) && !window.confirm("Kaydedilmemiş değişiklikleriniz var. Bunları bırakıp son kaydı yüklemek istiyor musunuz?")) return;
    setBusy(true); try { const updated = await apiRequest<LeadDetail>(url); setDetail(updated); setDraft(draftFromLead(updated.lead)); setConflict(false); setError(""); } catch (error) { report(error); } finally { setBusy(false); }
  }
  return <>
    <Link href="/admin" className="crm-back">← Müşteri listesine dön</Link>
    <div className="crm-page-heading crm-detail-heading"><div><span className="crm-overline">{lead.reference} / {sourceLabel(lead.source)}</span><h1>{lead.name}</h1><p className="crm-muted">{lead.company || lead.projectType} · Kayıt: {formatDate(lead.createdAt, true)}</p></div><span className={`crm-badge crm-badge--${stages.find((stage) => stage.id === lead.stage)?.color}`}>{lead.archivedAt ? "Arşivde" : stageLabel(lead.stage)}</span></div>
    <div className="crm-contact-shortcuts">{lead.phone && <a href={`tel:${lead.phone.replace(/[^+\d]/g, "")}`}>Telefonla ara ↗</a>}{lead.email && <a href={`mailto:${lead.email}`}>E-posta yaz ↗</a>}<button onClick={reload} disabled={busy}>Kaydı yenile ↻</button></div>
    {message && <div className="crm-success" role="status">{message}</div>}{error && <div className="crm-error" role="alert">{error}{conflict && <button className="crm-inline-button" onClick={reload}>Son kaydı yükle ve kaydedilmemiş değişiklikleri bırak</button>}</div>}
    <div className="crm-detail-grid"><section className="crm-panel crm-detail-panel"><div className="crm-panel-heading"><h2>Müşteri ve iş bilgileri</h2><span className="crm-muted">{lead.assigneeName || "Sorumlu atanmadı"}</span></div><form onSubmit={save} className="crm-detail-form"><LeadFields draft={draft} setDraft={setDraft} users={users} existing disabled={busy || !!lead.archivedAt} /><div className="crm-form-actions"><span className="crm-field-help">Değişiklikler görüşme geçmişine işlenir.</span><button className="crm-button" disabled={busy || !!lead.archivedAt}>{busy ? "İşleniyor…" : "Değişiklikleri kaydet"}</button></div></form></section>
      <aside className="crm-timeline-side"><section className="crm-panel crm-note-panel"><h2>Görüşme notu ekle</h2><p className="crm-muted">Ne konuşuldu, sıradaki adım ne?</p><form onSubmit={addNote}><label className="sr-only" htmlFor="lead-note">Görüşme notu</label><textarea id="lead-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Örneğin: Çatı fotoğrafları istendi. Cuma tekrar aranacak." required maxLength={3000} rows={4} /><button className="crm-button crm-button--quiet" disabled={busy || !note.trim()}>Notu kaydet ＋</button></form></section><section className="crm-panel crm-history"><h2>İşlem ve görüşme geçmişi</h2><ol>{detail.events.map((event) => <li key={event.id}><span className={`crm-event-dot crm-event-dot--${event.kind}`} aria-hidden="true">{event.kind === "note" ? "✎" : event.kind === "stage" ? "↗" : "·"}</span><div><strong>{event.actorName}</strong><time dateTime={event.createdAt}>{formatDate(event.createdAt, true)}</time><p>{event.content}</p></div></li>)}</ol></section>
        <NotificationStatus key={JSON.stringify([detail.deliveries, detail.smsDeliveries])} detail={detail} />
        <button className="crm-archive-button" onClick={archive} disabled={busy}>{lead.archivedAt ? "↶ Arşivden çıkar" : "Kaydı arşive taşı"}</button>
      </aside></div>
  </>;
}
