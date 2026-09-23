"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatDate, type Lead } from "@/lib/crm/types";
import { defaultQuoteDate, defaultQuoteMessage, quoteMoney, quoteStatuses, type Currency, type Quote, type QuoteCapabilities, type QuoteDetail, type VatMode } from "@/lib/quotes/types";
import { QuoteDocument } from "@/components/quotes/QuoteDocument";
import { apiRequest } from "./client";

type Draft = { title: string; message: string; amount: string; currency: Currency; vatMode: VatMode; validUntil: string; emailRequested: boolean; smsRequested: boolean };
function draftOf(lead: Lead, quote?: Quote): Draft {
  return { title: quote?.title ?? `${lead.projectType} Teklifi`, message: quote?.message ?? defaultQuoteMessage(lead.name, lead.projectType), amount: quote ? (quote.amountCents / 100).toFixed(2) : "", currency: quote?.currency ?? "TRY", vatMode: quote?.vatMode ?? "included", validUntil: quote?.status === "draft" ? quote.validUntil : defaultQuoteDate(), emailRequested: quote?.emailRequested ?? !!lead.email, smsRequested: quote?.smsRequested ?? false };
}
const deliveryLabels: Record<string, string> = { held: "Gönderilmedi · kanal kapalı / beklemede", pending: "Sırada", sending: "Gönderiliyor", sent: "E-posta sağlayıcı kabul etti", accepted: "SMS sağlayıcı kabul etti", delivered: "Teslim edildi", failed: "Gönderim başarısız", unknown: "Sonuç belirsiz · kontrol gerekli", cancelled: "İptal edildi" };
export function QuoteEditor({ lead, initial, revision, capabilities }: { lead: Lead; initial?: QuoteDetail; revision?: Quote; capabilities: QuoteCapabilities }) {
  const router = useRouter(), form = useRef<HTMLFormElement>(null), dialog = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState(initial), [draft, setDraft] = useState(() => draftOf(lead, initial?.quote ?? revision));
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(!!initial && initial.quote.status !== "draft"), [confirmSend, setConfirmSend] = useState(false), [copyUrl, setCopyUrl] = useState("");
  const createKey = useRef<string | null>(null), sendKey = useRef<string | null>(null);
  const quote = detail?.quote, isDraft = !quote || quote.status === "draft";
  const base = quote ? `/api/admin/teklifler/${quote.id}` : "";
  useEffect(() => { if (confirmSend) dialog.current?.showModal(); else dialog.current?.close(); }, [confirmSend]);
  function failure(error: unknown) { setError(error instanceof Error ? error.message : "İşlem tamamlanamadı."); }
  async function reload(id = quote?.id) {
    if (!id) return;
    const result = await apiRequest<QuoteDetail>(`/api/admin/teklifler/${id}`); setDetail(result); return result;
  }
  async function saveDraft() {
    const key = createKey.current ??= crypto.randomUUID();
    const result = await apiRequest<{ quote: Quote }>(quote ? base : "/api/admin/teklifler", { method: quote ? "PATCH" : "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify({ ...draft, action: "update", leadId: lead.id, revisionOf: revision?.id, editVersion: quote?.editVersion }) });
    await reload(result.quote.id);
    if (!quote) router.replace(`/admin/talepler/${lead.id}/teklifler/${result.quote.id}`);
    return result.quote;
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError(""); setNotice("");
    try { await saveDraft(); setNotice("Teklif taslağı kaydedildi."); } catch (error) { failure(error); } finally { setBusy(false); }
  }
  async function summarize() {
    if (busy || (isDraft && !form.current?.reportValidity())) return;
    setBusy(true); setError(""); setNotice("");
    try { if (isDraft) { await saveDraft(); if (!quote) return; } sendKey.current ??= crypto.randomUUID(); setConfirmSend(true); } catch (error) { failure(error); } finally { setBusy(false); }
  }
  async function send() {
    if (busy || !quote) return; setBusy(true); setError("");
    try {
      await apiRequest(base, { method: "PATCH", headers: { "Idempotency-Key": sendKey.current ??= crypto.randomUUID() }, body: JSON.stringify({ action: quote.status === "draft" ? "send" : "resend", editVersion: quote.editVersion }) });
      await reload(); setConfirmSend(false); sendKey.current = null; setNotice("Teklif kaydedildi ve gönderim işleri oluşturuldu. Kanal durumlarını aşağıdan takip edebilirsiniz.");
    } catch (error) { failure(error); } finally { setBusy(false); }
  }
  async function upload(file?: File) {
    if (!file || busy || !quote) return;
    if (file.size > 3 * 1024 * 1024) { setError("Dosya en fazla 3 MB olabilir."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const saved = await saveDraft();
      const response = await fetch(`${base}/dosyalar`, { method: "POST", headers: { "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name), "X-Edit-Version": String(saved.editVersion) }, body: file, credentials: "same-origin" });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Dosya yüklenemedi.");
      await reload(); setNotice("Dosya özel olarak kaydedildi.");
    } catch (error) { failure(error); } finally { setBusy(false); }
  }
  async function removeFile(fileId: string) {
    if (busy || !quote) return; setBusy(true); setError("");
    try { await apiRequest(`${base}/dosyalar/${fileId}`, { method: "DELETE", headers: { "X-Edit-Version": String(quote.editVersion) } }); await reload(); } catch (error) { failure(error); } finally { setBusy(false); }
  }
  async function copyLink() {
    if (busy) return; setBusy(true); setError("");
    try { const { url } = await apiRequest<{ url: string }>(base, { method: "PATCH", body: JSON.stringify({ action: "link" }) }); setCopyUrl(url); await navigator.clipboard.writeText(url).then(() => setNotice("Özel teklif bağlantısı kopyalandı."), () => setNotice("Bağlantıyı aşağıdaki alandan kopyalayabilirsiniz.")); } catch (error) { failure(error); } finally { setBusy(false); }
  }
  async function revoke() {
    if (busy || !window.confirm("Bu teklifin tüm müşteri bağlantıları kapanacak ve bekleyen gönderimler iptal edilecek. Onaylıyor musunuz?")) return;
    setBusy(true); setError(""); try { await apiRequest(base, { method: "PATCH", body: JSON.stringify({ action: "revoke" }) }); await reload(); setCopyUrl(""); } catch (error) { failure(error); } finally { setBusy(false); }
  }
  async function retry(id: string, channel: string, status: string) {
    const uncertain = status === "unknown";
    if (busy || !window.confirm(uncertain ? "Sağlayıcı ve alıcı kayıtlarından önceki gönderimin teslim edilmediğini doğruladınız mı? Tekrar göndermek kopya ileti oluşturabilir." : "Bu bildirimi müşteriye / belirtilen alıcıya yeniden göndermek istiyor musunuz?")) return;
    setBusy(true); setError(""); try { await apiRequest(base, { method: "PATCH", body: JSON.stringify({ action: "retry", deliveryId: id, channel, confirmedNotSent: uncertain }) }); await reload(); } catch (error) { failure(error); } finally { setBusy(false); }
  }
  const displayed: Quote = quote && !isDraft ? quote : { ...(quote ?? revision), id: quote?.id ?? "", threadId: quote?.threadId ?? "", leadId: lead.id, leadReference: lead.reference, editVersion: quote?.editVersion ?? 1, customerEmail: lead.email, customerPhone: lead.phone, customerName: lead.name, projectType: lead.projectType, quoteNumber: quote?.quoteNumber ?? "Kaydedildiğinde oluşturulacak", version: quote?.version ?? (revision ? revision.version + 1 : 1), ...draft, amountCents: Math.round(Number(draft.amount || 0) * 100), status: "draft", attachments: quote?.attachments ?? revision?.attachments ?? [], createdAt: quote?.createdAt ?? new Date().toISOString(), updatedAt: quote?.updatedAt ?? new Date().toISOString(), sentAt: null, firstViewedAt: null, lastViewedAt: null, acceptedAt: null, revisionRequestedAt: null, revisionMessage: "", expiredAt: null, revokedAt: null };
  return <>
    <Link href={`/admin/talepler/${lead.id}`} className="crm-back">← Müşteri kaydına dön</Link>
    <div className="crm-page-heading"><div><span className="crm-overline">{quote?.quoteNumber ?? "YENİ TEKLİF"} · V{displayed.version}</span><h1>{isDraft ? "Teklif Hazırla" : quoteStatuses[quote!.status]}</h1><p className="crm-muted">İlişkili Talep: {lead.reference} · {lead.projectType}</p></div><button className="crm-button crm-button--quiet" disabled={busy} onClick={() => { if (!isDraft || form.current?.reportValidity()) setPreview(!preview); }}>{preview ? "Önizlemeyi kapat" : "Önizleme"}</button></div>
    <section className="crm-panel crm-quote-customer"><div><span>Müşteri</span><strong>{lead.name}</strong></div><div><span>E-posta</span><strong>{lead.email || "Kayda eklenmemiş"}</strong></div><div><span>Telefon</span><strong>{lead.phone || "Kayda eklenmemiş"}</strong></div><div><span>Talep</span><strong>{lead.projectType}</strong></div></section>
    {!capabilities.sending && <div className="crm-notice">Teklif gönderimi kapalı. Taslak hazırlayabilir, dosya ekleyebilir ve önizleyebilirsiniz.</div>}
    {notice && <div className="crm-success" role="status">{notice}</div>}{error && !confirmSend && <div className="crm-error" role="alert">{error}<button className="crm-inline-button" onClick={() => { if (window.confirm("Kaydedilmemiş değişiklikleri bırakıp güncel teklifi yüklemek istiyor musunuz?")) void reload().then(result => { if (result) { setDraft(draftOf(lead, result.quote)); setError(""); } }).catch(failure); }}>Güncel sürümü yükle</button></div>}
    {preview && <div className="crm-quote-preview"><QuoteDocument quote={displayed} fileBase={quote ? `${base}/dosyalar` : undefined} /></div>}
    {isDraft ? <section className="crm-panel crm-quote-editor"><form ref={form} onSubmit={save}><fieldset className="crm-fields" disabled={busy}><label className="crm-field crm-span">Teklif başlığı<input required maxLength={180} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label><label className="crm-field">Teklif tutarı<input required type="number" min="0.01" max="9999999999.99" step="0.01" value={draft.amount} onChange={e => setDraft({ ...draft, amount: e.target.value })} placeholder="420000.00" /></label><label className="crm-field">Para birimi<select value={draft.currency} onChange={e => setDraft({ ...draft, currency: e.target.value as Currency })}><option value="TRY">TRY · Türk lirası</option><option value="USD">USD · ABD doları</option><option value="EUR">EUR · Euro</option></select></label><label className="crm-field">KDV durumu<select value={draft.vatMode} onChange={e => setDraft({ ...draft, vatMode: e.target.value as VatMode })}><option value="included">KDV Dahil</option><option value="excluded">KDV Hariç</option></select></label><label className="crm-field">Geçerlilik tarihi<input type="date" required value={draft.validUntil} onChange={e => setDraft({ ...draft, validUntil: e.target.value })} /></label><label className="crm-field crm-span">Müşteriye mesaj<textarea rows={10} required maxLength={6000} value={draft.message} onChange={e => setDraft({ ...draft, message: e.target.value })} /></label><div className="crm-quote-channels crm-span"><label><input type="checkbox" checked={draft.emailRequested} onChange={e => setDraft({ ...draft, emailRequested: e.target.checked })} />E-posta ile gönder <small>{capabilities.email ? "Hazır" : "Kanal kapalı · bekletilecek"}</small></label><label><input type="checkbox" checked={draft.smsRequested} onChange={e => setDraft({ ...draft, smsRequested: e.target.checked })} />SMS ile gönder <small>{capabilities.sms ? "Hazır" : "Kanal kapalı · bekletilecek"}</small></label></div></fieldset><div className="crm-form-actions"><span className="crm-field-help">Müşteri bilgileri talep kaydından alınır.</span><button className="crm-button crm-button--quiet" disabled={busy}>Taslak Kaydet</button><button type="button" className="crm-button" disabled={busy || !capabilities.sending} onClick={summarize}>Teklif Gönder →</button></div></form></section> : <section className="crm-panel crm-quote-editor"><div className="crm-quote-actions"><button className="crm-button crm-button--quiet" onClick={() => void reload().catch(failure)} disabled={busy}>Durumu yenile ↻</button>{quote && !["revoked", "expired"].includes(quote.status) && <button className="crm-button crm-button--quiet" onClick={copyLink} disabled={busy}>Linki Kopyala</button>}{quote && ["sent", "viewed"].includes(quote.status) && <button className="crm-button" onClick={summarize} disabled={busy || !capabilities.sending}>Tekrar Gönder</button>}{quote && quote.status !== "accepted" && !lead.archivedAt && <Link className="crm-button crm-button--quiet" href={`/admin/talepler/${lead.id}/teklifler/yeni?revisionOf=${quote.id}`}>Yeni Revizyon Oluştur</Link>}</div>{copyUrl && <label className="crm-field crm-quote-link">Size özel paylaşım bağlantısı<input readOnly value={copyUrl} onFocus={e => e.target.select()} /></label>}<dl className="crm-quote-timestamps">{[["Gönderildi", quote?.sentAt], ["İlk görüntülenme", quote?.firstViewedAt], ["Son görüntülenme", quote?.lastViewedAt], ["Kabul edildi", quote?.acceptedAt], ["Revizyon istendi", quote?.revisionRequestedAt]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{formatDate(value ?? null, true)}</dd></div>)}</dl>{quote?.revisionMessage && <div className="crm-notice crm-quote-revision"><strong>Revizyon talebi</strong><p>{quote.revisionMessage}</p></div>}</section>}
    <section className="crm-panel crm-quote-editor"><h2>Teklif dokümanları</h2><p className="crm-muted">PDF, PNG veya JPG · Dosya başına 3 MB · En fazla 5 dosya</p>{!quote && <p className="crm-muted">Dosya eklemek için önce taslağı kaydedin. Revizyon oluştururken önceki dosyalar kopyalanır.</p>}{quote?.attachments.map(file => <div className="crm-quote-file" key={file.id}><a href={`${base}/dosyalar/${file.id}`} download>{file.filename} ↓ <small>{(file.sizeBytes / 1024).toFixed(0)} KB</small></a>{isDraft && <button type="button" className="crm-button crm-button--quiet" disabled={busy} onClick={() => removeFile(file.id)}>Kaldır</button>}</div>)}{quote && isDraft && <label className="crm-field crm-quote-upload">Dosya ekle<input type="file" accept="application/pdf,image/png,image/jpeg" disabled={busy || quote.attachments.length >= 5} onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; void upload(file); }} /></label>}</section>
    {detail && <div className="crm-quote-bottom"><section className="crm-panel crm-quote-editor"><h2>Gönderim durumu</h2><p className="crm-muted">Sağlayıcı kabulü, kesin teslim anlamına gelmez. Kapalı kanallar kendiliğinden gönderilmez.</p>{detail.deliveries.length === 0 && <p className="crm-muted">Henüz gönderim işi yok.</p>}{detail.deliveries.map(delivery => <div className="crm-quote-delivery" key={delivery.id}><strong>{delivery.channel === "email" ? "E-posta" : "SMS"} · {delivery.recipient}</strong><span>{deliveryLabels[delivery.status] || delivery.status}</span>{delivery.purpose !== "quote_customer" && <small>Mühendis bildirimi</small>}{delivery.sentAt && <small>{formatDate(delivery.sentAt, true)}</small>}{["held", "failed", "unknown"].includes(delivery.status) && <button className="crm-button crm-button--quiet" disabled={busy || !capabilities.sending || !(delivery.channel === "email" ? capabilities.email : capabilities.sms)} onClick={() => retry(delivery.id, delivery.channel, delivery.status)}>Kontrol edip yeniden dene</button>}</div>)}</section><section className="crm-panel crm-history"><h2>Teklif geçmişi</h2><ol>{detail.events.map(event => <li key={event.id}><span className="crm-event-dot">·</span><div><strong>{event.actorName}</strong><time>{formatDate(event.createdAt, true)}</time><p>{event.content}</p></div></li>)}</ol></section></div>}
    {quote && quote.status !== "revoked" && <button className="crm-archive-button" disabled={busy} onClick={revoke}>Teklifi İptal Et</button>}
    <dialog className="crm-quote-dialog" ref={dialog} onCancel={event => { event.preventDefault(); if (!busy) setConfirmSend(false); }} aria-labelledby="quote-send-title"><h2 id="quote-send-title">Gönderim özetini kontrol edin</h2>{quote && <><dl><div><dt>Müşteri</dt><dd>{quote.customerName}</dd></div><div><dt>E-posta</dt><dd>{quote.customerEmail || "—"}</dd></div><div><dt>Telefon</dt><dd>{quote.customerPhone || "—"}</dd></div><div><dt>Teklif</dt><dd>{quote.quoteNumber} · V{quote.version}<br /><strong>{quoteMoney(quote.amountCents, quote.currency)}</strong></dd></div><div><dt>E-posta</dt><dd>{quote.emailRequested ? capabilities.email ? "Gönderilecek" : "Kapalı · kuyrukta bekletilecek" : "Seçilmedi"}</dd></div><div><dt>SMS</dt><dd>{quote.smsRequested ? capabilities.sms ? "Gönderilecek" : "Kapalı · kuyrukta bekletilecek" : "Seçilmedi"}</dd></div></dl><p className="crm-muted">Gönderilmiş teklifin tutarı ve dosyaları değiştirilemez. Değişiklik için yeni revizyon oluşturulur.</p></>}{error && <div className="crm-error" role="alert">{error}</div>}<div className="crm-form-actions"><button className="crm-button crm-button--quiet" disabled={busy} onClick={() => setConfirmSend(false)}>Vazgeç</button><button className="crm-button" disabled={busy || !capabilities.sending} onClick={send}>{busy ? "İşleniyor…" : "Teklif Gönder"}</button></div></dialog>
  </>;
}
