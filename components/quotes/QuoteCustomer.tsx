"use client";
import { useEffect, useRef, useState } from "react";
import type { PublicQuote } from "@/lib/quotes/types";
import { QuoteDocument } from "./QuoteDocument";

export function QuoteCustomer({ initial, token }: { initial: PublicQuote; token: string }) {
  const [quote, setQuote] = useState(initial), [mode, setMode] = useState<"accept" | "revision" | null>(null);
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const endpoint = `/api/teklif/${encodeURIComponent(token)}`;
  useEffect(() => {
    let cancelled = false, recorded = false;
    const mark = () => {
      if (document.visibilityState !== "visible" || recorded) return;
      recorded = true;
      void fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "view" }), credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer" })
        .then(async response => response.ok ? response.json() : null).then(result => { if (!cancelled && result?.quote) setQuote(previous => previous.acceptedAt || previous.revisionRequestedAt ? previous : result.quote); }).catch(() => {});
    };
    mark(); document.addEventListener("visibilitychange", mark);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", mark); };
  }, [endpoint]);
  useEffect(() => { if (mode) dialog.current?.showModal(); else dialog.current?.close(); }, [mode]);
  async function respond() {
    if (busy || !mode) return; setBusy(true); setError("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: mode, confirmed: mode === "accept", message }), credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "İşlem tamamlanamadı.");
      setQuote(result.quote); setMode(null);
    } catch (error) { setError(error instanceof Error ? error.message : "İşlem tamamlanamadı. Tekrar deneyin."); }
    finally { setBusy(false); }
  }
  const canAct = ["sent", "viewed"].includes(quote.status);
  return <div className="quote-page"><QuoteDocument quote={quote} fileBase={`${endpoint}/dosyalar`} />
    <section className="quote-response" aria-live="polite">
      {canAct ? <><h2>Sıradaki adımı birlikte planlayalım.</h2><p>Teklifi onaylayabilir veya değişiklik isteğinizi ekibimize iletebilirsiniz.</p><div className="quote-response-actions"><button className="quote-button" onClick={() => { setError(""); setMode("accept"); }}>Teklifi Kabul Et</button><button className="quote-button quote-button--quiet" onClick={() => { setError(""); setMode("revision"); }}>Revizyon İste</button></div><small>Bu işlem teklif onayıdır; nitelikli elektronik imza veya online ödeme işlemi değildir.</small></> : quote.status === "accepted" ? <><h2>Teklif onayınız alındı.</h2><p>Teşekkür ederiz. Ekibimiz sonraki adımlar için sizinle iletişime geçecek.</p></> : quote.status === "revision_requested" ? <><h2>Revizyon talebiniz alındı.</h2><p className="quote-message">{quote.revisionMessage}</p><p>Ekibimiz isteğinizi inceleyip size dönüş yapacak.</p></> : <><h2>Bu teklif artık yanıt kabul etmiyor.</h2><p>Güncel teklif için <a href="mailto:iletisim@asirsolar.com">ekibimizle iletişime geçin</a>.</p></>}
    </section>
    <p className="quote-private-note">Bu sayfa size özel bir bağlantıyla açılır. Bağlantıyı yalnızca ilgili kişilerle paylaşın.</p>
    <dialog ref={dialog} className="quote-dialog" onCancel={event => { event.preventDefault(); if (!busy) setMode(null); }} aria-labelledby="quote-confirm-title">
      <h2 id="quote-confirm-title">{mode === "accept" ? "Teklif Onayı" : "Revizyon talebiniz"}</h2>
      <p>{mode === "accept" ? `${quote.quoteNumber} numaralı teklifin V${quote.version} sürümünü kabul etmek istediğinizi onaylıyor musunuz?` : "Değişmesini istediğiniz bilgileri ekibimizle paylaşın."}</p>
      {mode === "revision" && <label>Revizyon talebiniz<textarea rows={5} maxLength={2000} minLength={3} value={message} onChange={event => setMessage(event.target.value)} placeholder="Revizyon talebinizi yazabilirsiniz." /></label>}
      {error && <p className="quote-error" role="alert">{error}</p>}
      <div className="quote-response-actions"><button className="quote-button quote-button--quiet" disabled={busy} onClick={() => setMode(null)}>Vazgeç</button><button className="quote-button" disabled={busy || (mode === "revision" && message.trim().length < 3)} onClick={respond}>{busy ? "Kaydediliyor…" : mode === "accept" ? "Teklifi Onaylıyorum" : "Revizyon Talebini Gönder"}</button></div>
    </dialog>
  </div>;
}
