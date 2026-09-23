import Image from "next/image";
import { quoteDate, quoteMoney, quoteStatuses, vatLabel, type PublicQuote } from "@/lib/quotes/types";

export function QuoteDocument({ quote, fileBase }: { quote: PublicQuote; fileBase?: string }) {
  return <article className="quote-document">
    <header className="quote-brand"><Image src="/images/brand/asir-logo.jpeg" alt="Asır Solar Güneş Enerjisi Sistemleri" width={140} height={140} unoptimized /><div><span>ASIR SOLAR</span><p>GÜNEŞ ENERJİSİ SİSTEMLERİ</p></div></header>
    <div className="quote-document-body">
      <div className="quote-eyebrow">{quote.quoteNumber} <span>V{quote.version}</span></div>
      <h1>Sayın {quote.customerName},<br />teklifiniz hazır.</h1>
      <p className="quote-title">{quote.title}</p>
      <span className={`quote-status quote-status--${quote.status}`}>{quoteStatuses[quote.status]}</span>
      <dl className="quote-facts"><div><dt>İlişkili Talep</dt><dd>{quote.leadReference}</dd></div><div><dt>Proje</dt><dd>{quote.projectType}</dd></div><div><dt>Hazırlanma tarihi</dt><dd>{quoteDate(quote.createdAt)}</dd></div><div><dt>Geçerlilik tarihi</dt><dd>{quoteDate(quote.validUntil)}</dd></div><div><dt>Teklif numarası / sürüm</dt><dd>{quote.quoteNumber} / V{quote.version}</dd></div></dl>
      <div className="quote-price"><span>Teklif bedeli</span><strong>{quoteMoney(quote.amountCents, quote.currency)}</strong><span>{vatLabel(quote.vatMode)}</span></div>
      <div className="quote-message">{quote.message}</div>
      {quote.attachments.length > 0 && <section className="quote-files"><h2>Teklif dokümanları</h2><p>{quote.quoteNumber} · V{quote.version} sürümüne ait dosyalar.</p><ul>{quote.attachments.map((file, index) => <li key={file.id}><div><strong>{file.filename}</strong><small>{(file.sizeBytes / 1024).toFixed(0)} KB · {file.mimeType === "application/pdf" ? "PDF" : "Görsel"}</small></div>{fileBase && quote.status !== "expired" ? <a href={`${fileBase}/${encodeURIComponent(file.id)}`} download className={index === 0 ? "quote-button" : "quote-button quote-button--quiet"}>{index === 0 ? "Teklifi İndir" : "Dosyayı İndir"} ↓</a> : <span>Ekli dosya</span>}</li>)}</ul></section>}
    </div>
    <footer className="quote-footer"><strong>ASIR SOLAR GÜNEŞ ENERJİSİ SİSTEMLERİ</strong><a href="mailto:iletisim@asirsolar.com">iletisim@asirsolar.com</a><p>Sorularınız için ekibimizle iletişime geçebilirsiniz.</p></footer>
  </article>;
}
