"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { projectTypes } from "@/lib/enquiry";
import { formatDate } from "@/lib/crm/types";
import { lostReasons, manualPipelineStages, pipelineLabel, pipelineStages, relativeActivity, type PipelineCard, type PipelineData, type PipelineStage } from "@/lib/crm/pipeline-types";
import { quoteMoney, quoteStatuses, type Currency } from "@/lib/quotes/types";
import { apiRequest } from "./client";

const emptyFilters = { q: "", project: "", stage: "", quote: "", viewed: "", accepted: "", from: "", to: "", sort: "activity" };
export function PipelineBoard({ initial }: { initial: PipelineData }) {
  const [data, setData] = useState(initial), [filters, setFilters] = useState(emptyFilters), [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [now, setNow] = useState(() => Date.parse(initial.generatedAt)), [dragging, setDragging] = useState<string | null>(null), [over, setOver] = useState<string | null>(null);
  const [lost, setLost] = useState<PipelineCard | null>(null), [reason, setReason] = useState<string>(""), [note, setNote] = useState("");
  const dialog = useRef<HTMLDialogElement>(null), controller = useRef<AbortController | null>(null), mutating = useRef(false), requestNumber = useRef(0);
  const params = useMemo(() => { const result = new URLSearchParams({ page: String(page) }); for (const [key, value] of Object.entries(filters)) if (value) result.set(key, value); return result.toString(); }, [filters, page]);
  const reload = useCallback(async (clearError = true) => {
    if (mutating.current) return;
    controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
    const request = ++requestNumber.current; setLoading(true);
    try {
      const result = await apiRequest<PipelineData>(`/api/admin/crm?${params}`, { signal: abort.signal });
      if (request === requestNumber.current) { setData(result); setNow(Date.parse(result.generatedAt)); if (clearError) setError(""); }
    } catch (error) { if (!abort.signal.aborted) setError(error instanceof Error ? error.message : "Satış süreci yüklenemedi."); }
    finally { if (request === requestNumber.current) setLoading(false); }
  }, [params]);
  const latestReload = useRef(reload);
  useEffect(() => {
    latestReload.current = reload;
    const timer = setTimeout(() => void reload(), 300);
    const refresh = () => { if (document.visibilityState === "visible") void reload(); };
    const poll = setInterval(refresh, 30000); window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { clearTimeout(timer); clearInterval(poll); controller.current?.abort(); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [reload]);
  useEffect(() => { if (lost) dialog.current?.showModal(); else dialog.current?.close(); }, [lost]);
  function change(key: keyof typeof filters, value: string) { setFilters(previous => ({ ...previous, [key]: value })); setPage(1); }
  function canMove(card: PipelineCard, stage: PipelineStage) {
    if (card.hasAccepted || stage === card.stage) return false;
    if (stage === "lost") return true;
    return !card.systemControlled && (card.quoteStatus !== "draft" || stage === "preparing");
  }
  async function move(card: PipelineCard, stage: PipelineStage, loss?: { reason: string; note: string }) {
    if (mutating.current) return;
    if (!manualPipelineStages.includes(stage) || !canMove(card, stage)) { setError("Bu aşama gerçek teklif olaylarıyla yönetiliyor. Talep detayından devam edin."); return; }
    if (stage === "lost" && !loss) { setReason(""); setNote(""); setError(""); setLost(card); return; }
    mutating.current = true; controller.current?.abort(); ++requestNumber.current; setLoading(false); setBusy(true); setError(""); setNotice("");
    let succeeded = false;
    try {
      await apiRequest("/api/admin/crm", { method: "PATCH", body: JSON.stringify({ id: card.id, stage, version: card.version, expectedStage: card.stage, expectedActivity: card.lastActivityAt, ...loss }) });
      setNotice(`${card.reference} · ${pipelineLabel(stage)} aşamasına taşındı.`); setLost(null); succeeded = true;
    } catch (error) { setError(error instanceof Error ? error.message : "Aşama değiştirilemedi."); }
    finally { mutating.current = false; setBusy(false); }
    // Preserve mutation errors until the next intentional refresh; successful updates fetch the authoritative board.
    if (succeeded || stage !== "lost") await latestReload.current(false);
  }
  function drop(event: DragEvent, stage: PipelineStage) {
    event.preventDefault(); setOver(null); setDragging(null);
    const id = event.dataTransfer.getData("application/x-asir-lead"); const card = data.cards.find(item => item.id === id);
    if (card) void move(card, stage);
  }
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setNotice(`${label} kopyalandı.`); } catch { setError("Kopyalama izni alınamadı. Bilgiyi talep detayından kopyalayabilirsiniz."); }
  }
  const amounts = (Object.entries(data.summary.amounts) as [Currency, number][]).filter(([, amount]) => amount > 0);
  return <>
    <div className="crm-page-heading"><div><span className="crm-overline">CRM</span><h1>Satış Süreci</h1><p className="crm-muted">İlk talepten teklif onayına, tüm müşteri süreci.</p></div><div className="pipeline-heading-actions"><Link className="crm-button crm-button--quiet" href="/admin">Talep listesi</Link><button className="crm-button" onClick={() => void reload()} disabled={busy || loading}>{loading ? "Güncelleniyor…" : "Panoyu Yenile ↻"}</button></div></div>
    <div className="pipeline-summary"><div><span>Toplam Açık Talep</span><strong>{data.summary.open}</strong></div><div><span>Teklif Gönderilen</span><strong>{data.summary.sent}</strong></div><div><span>Kabul Edilen</span><strong>{data.summary.accepted}</strong></div><div><span>Toplam Açık Teklif Tutarı</span><div className="pipeline-amounts">{amounts.length ? amounts.map(([currency, amount]) => <strong key={currency}>{quoteMoney(amount, currency)}</strong>) : <strong>—</strong>}</div></div></div>
    <section className="crm-panel pipeline-filters" aria-label="CRM arama ve filtreler"><label className="crm-field pipeline-search">Müşteri veya referans ara<input type="search" value={filters.q} maxLength={120} placeholder="ASR-TLP-31, ASR-TKLF-12, ad, telefon…" onChange={event => change("q", event.target.value)} /></label><label className="crm-field">Proje Türü<select value={filters.project} onChange={event => change("project", event.target.value)}><option value="">Tüm projeler</option>{projectTypes.map(project => <option key={project}>{project}</option>)}</select></label><label className="crm-field">Aşama<select value={filters.stage} onChange={event => change("stage", event.target.value)}><option value="">Tüm aşamalar</option>{pipelineStages.map(stage => <option value={stage.id} key={stage.id}>{stage.label}</option>)}</select></label><label className="crm-field">Sıralama<select value={filters.sort} onChange={event => change("sort", event.target.value)}><option value="activity">Son aktivite</option><option value="newest">Yeni → Eski</option><option value="oldest">Eski → Yeni</option><option value="amount">Tutar ↓ · para birimine göre</option></select></label>
      <details className="pipeline-more"><summary>Diğer filtreler {Object.entries(filters).filter(([key, value]) => ["quote", "viewed", "accepted", "from", "to"].includes(key) && value).length > 0 && "•"}</summary><div>{([["quote", "Teklif", "Var", "Yok"], ["viewed", "Görüntülenme", "Görüntülendi", "Görüntülenmedi"], ["accepted", "Kabul Durumu", "Kabul edildi", "Kabul edilmedi"]] as const).map(([key, label, yes, no]) => <label className="crm-field" key={key}>{label}<select value={filters[key]} onChange={event => change(key, event.target.value)}><option value="">Tümü</option><option value="yes">{yes}</option><option value="no">{no}</option></select></label>)}<label className="crm-field">Başlangıç<input type="date" value={filters.from} onChange={event => change("from", event.target.value)} /></label><label className="crm-field">Bitiş<input type="date" value={filters.to} onChange={event => change("to", event.target.value)} /></label><button className="crm-button crm-button--quiet" onClick={() => { setFilters(emptyFilters); setPage(1); }}>Filtreleri temizle</button></div></details>
    </section>
    <div className="pipeline-status"><span>{data.total} talep · {data.cards.length} kart gösteriliyor</span><span>{loading ? "Güncelleniyor…" : "30 saniyede bir güncellenir"}</span></div>
    <p className="pipeline-hint">Kartları sürükleyin veya karttaki “Aşamayı değiştir” menüsünü kullanın. Teklif gönderimi, görüntülenme ve müşteri yanıtları otomatik işlenir.</p>
    <div aria-live="polite">{notice && <div className="crm-success" role="status">{notice}</div>}{error && !lost && <div className="crm-error" role="alert">{error}</div>}</div>
    <div className="pipeline-board" aria-label="Satış aşamaları" aria-busy={busy || loading}>
      {pipelineStages.map(stage => <section key={stage.id} className={`pipeline-column pipeline-column--${stage.id}`} data-over={over === stage.id} onDragOver={event => { if (dragging && !busy) { event.preventDefault(); setOver(stage.id); } }} onDragLeave={() => setOver(null)} onDrop={event => drop(event, stage.id)} aria-labelledby={`pipeline-${stage.id}`}>
        <header><h2 id={`pipeline-${stage.id}`}>{stage.label}</h2><span aria-label={`${data.counts[stage.id]} talep`}>{data.counts[stage.id]}</span></header>
        <div className="pipeline-column-cards">{data.cards.filter(card => card.stage === stage.id).map(card => <article className="pipeline-card" key={card.id} draggable={!busy && !card.hasAccepted} onDragStart={event => { event.dataTransfer.setData("application/x-asir-lead", card.id); event.dataTransfer.effectAllowed = "move"; setDragging(card.id); }} onDragEnd={() => { setDragging(null); setOver(null); }} data-dragging={dragging === card.id}>
          <Link className="pipeline-card-main" draggable={false} href={`/admin/talepler/${card.id}`} aria-label={`${card.reference} · ${card.name} · Talebi aç`}><span className="crm-overline">{card.reference}</span><h3>{card.name}</h3><p>{card.projectType}</p>{card.phone && <span className="pipeline-phone">{card.phone}</span>}<time dateTime={card.createdAt} title={formatDate(card.createdAt, true)}>Oluşturuldu · {now ? relativeActivity(card.createdAt, now) : formatDate(card.createdAt, true)}</time>{card.quoteNumber && <div className="pipeline-quote"><span>Son teklif · {card.quoteNumber} / V{card.quoteVersion}</span>{card.quoteAmount !== null && card.quoteCurrency && <strong>{quoteMoney(card.quoteAmount, card.quoteCurrency)}</strong>}<span className={`quote-status quote-status--${card.quoteStatus}`}>{quoteStatuses[card.quoteStatus!]}</span></div>}<div className="pipeline-activity"><p>{card.lastActivity}</p><time title={formatDate(card.lastActivityAt, true)} dateTime={card.lastActivityAt}>{now ? relativeActivity(card.lastActivityAt, now) : formatDate(card.lastActivityAt, true)}</time></div></Link>
          <footer><label className="sr-only" htmlFor={`move-${card.id}`}>{card.reference} aşamasını değiştir</label><select id={`move-${card.id}`} value="" disabled={busy || card.hasAccepted} onChange={event => void move(card, event.target.value as PipelineStage)}><option value="" disabled>Aşamayı değiştir</option>{pipelineStages.filter(item => manualPipelineStages.includes(item.id)).map(item => <option value={item.id} key={item.id} disabled={!canMove(card, item.id)}>{item.label}</option>)}</select><details className="pipeline-card-menu"><summary aria-label={`${card.reference} işlemleri`}>•••</summary><div><Link href={`/admin/talepler/${card.id}`}>Talebi Aç</Link><Link href={`/admin/talepler/${card.id}/teklifler/yeni`}>Teklif Hazırla</Link>{card.quoteId && <Link href={`/admin/talepler/${card.id}/teklifler/${card.quoteId}`}>Son Teklifi Görüntüle</Link>}{card.phone && <button onClick={() => void copy(card.phone, "Telefon")}>Telefonu Kopyala</button>}{card.email && <button onClick={() => void copy(card.email, "E-posta")}>E-postayı Kopyala</button>}</div></details></footer>
        </article>)}{!data.cards.some(card => card.stage === stage.id) && <p className="pipeline-empty">{data.counts[stage.id] ? "Bu sayfada kart yok. Diğer sayfaları kontrol edin." : "Bu aşamada müşteri bulunmuyor."}</p>}</div>
      </section>)}
    </div>
    {data.total > data.pageSize && <nav className="pipeline-pagination" aria-label="CRM sayfaları"><button className="crm-button crm-button--quiet" disabled={page <= 1 || busy} onClick={() => setPage(page - 1)}>← Önceki</button><span>Sayfa {page} / {Math.ceil(data.total / data.pageSize)}</span><button className="crm-button crm-button--quiet" disabled={page * data.pageSize >= data.total || busy} onClick={() => setPage(page + 1)}>Sonraki →</button></nav>}
    <dialog className="crm-quote-dialog" ref={dialog} onCancel={event => { event.preventDefault(); if (!busy) setLost(null); }} aria-labelledby="pipeline-lost-title"><h2 id="pipeline-lost-title">Kaybedildi olarak işaretle</h2><p>{lost?.reference} · {lost?.name}</p><p className="crm-muted">Talep ve teklif geçmişi korunur. Bu işlem mevcut müşteri teklif bağlantısını iptal etmez.</p><form onSubmit={event => { event.preventDefault(); if (lost) void move(lost, "lost", { reason, note }); }}><label className="crm-field">Neden<select required value={reason} disabled={busy} onChange={event => { setReason(event.target.value); setNote(""); }}><option value="">Bir neden seçin</option>{lostReasons.map(item => <option key={item}>{item}</option>)}</select></label>{reason === "Diğer" && <label className="crm-field">Not (isteğe bağlı)<textarea maxLength={1000} rows={3} disabled={busy} value={note} onChange={event => setNote(event.target.value)} /></label>}{error && <div className="crm-error" role="alert">{error}</div>}<div className="crm-form-actions"><button type="button" className="crm-button crm-button--quiet" disabled={busy} onClick={() => setLost(null)}>Vazgeç</button><button className="crm-button" disabled={busy || !reason}>Kaybedildi Olarak Kaydet</button></div></form></dialog>
  </>;
}
