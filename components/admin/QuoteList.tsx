"use client";
import Link from "next/link";
import { useState } from "react";
import { formatDate, type Lead } from "@/lib/crm/types";
import { quoteMoney, quoteStatuses, type QuoteDetail } from "@/lib/quotes/types";
import { apiRequest } from "./client";

export function QuoteList({ lead, initial }: { lead: Lead; initial: QuoteDetail[] }) {
  const [items, setItems] = useState(initial), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function refresh() { setBusy(true); setError(""); try { setItems((await apiRequest<{ quotes: QuoteDetail[] }>(`/api/admin/teklifler?leadId=${lead.id}`)).quotes); } catch (error) { setError(error instanceof Error ? error.message : "Teklifler yüklenemedi."); } finally { setBusy(false); } }
  return <section className="crm-panel crm-quotes-section"><div className="crm-panel-heading"><div><h2>Teklifler</h2><p className="crm-muted">Teklifleri hazırlayın, sürümleri ve müşteri yanıtlarını takip edin.</p></div><div className="crm-quote-actions"><button className="crm-button crm-button--quiet" onClick={refresh} disabled={busy}>Yenile ↻</button>{!lead.archivedAt && <Link className="crm-button" href={`/admin/talepler/${lead.id}/teklifler/yeni`}>Teklif Hazırla ＋</Link>}</div></div>
    {error && <div className="crm-error" role="alert">{error}</div>}
    {!items.length ? <div className="crm-quote-empty"><h3>İlk teklifinizi hazırlayın.</h3><p>Müşteri bilgileri bu kayıttan otomatik alınır. Göndermeden önce taslağı ve dosyaları inceleyebilirsiniz.</p></div> : <div className="crm-quote-cards">{items.map(({ quote }) => <Link className="crm-quote-card" key={quote.id} href={`/admin/talepler/${lead.id}/teklifler/${quote.id}`}><div><span className="crm-overline">{quote.quoteNumber} · V{quote.version}</span><h3>{quote.title}</h3><span className={`quote-status quote-status--${quote.status}`}>{quoteStatuses[quote.status]}</span></div><strong>{quoteMoney(quote.amountCents, quote.currency)}</strong><dl><div><dt>Oluşturuldu</dt><dd>{formatDate(quote.createdAt, true)}</dd></div><div><dt>Geçerlilik</dt><dd>{formatDate(quote.validUntil)}</dd></div><div><dt>Gönderildi</dt><dd>{formatDate(quote.sentAt, true)}</dd></div><div><dt>Görüntülendi</dt><dd>{formatDate(quote.firstViewedAt, true)}</dd></div>{quote.acceptedAt && <div><dt>Kabul edildi</dt><dd>{formatDate(quote.acceptedAt, true)}</dd></div>}{quote.revisionRequestedAt && <div><dt>Revizyon istendi</dt><dd>{formatDate(quote.revisionRequestedAt, true)}</dd></div>}</dl><span className="crm-muted">{quote.attachments.length} dosya · Teklifi görüntüle →</span></Link>)}</div>}
  </section>;
}
