import { emailLayout, escapeHtml } from "../crm/notification-templates.ts";
import { quoteMoney, quoteDate, vatLabel, type Quote } from "./types.ts";

export function renderQuoteEmail(quote: Quote, url: string, origin: string) {
  const summary = `${quote.quoteNumber} · V${quote.version}\nİlişkili Talep: ${quote.leadReference}\nProje: ${quote.projectType}\nTeklif bedeli: ${quoteMoney(quote.amountCents, quote.currency)} (${vatLabel(quote.vatMode)})\nGeçerlilik: ${quoteDate(quote.validUntil)}`;
  const text = `Sayın ${quote.customerName}, teklifiniz hazır.\n\n${summary}\n\n${quote.message}\n\nTeklifi incele: ${url}\nEkli dosyalarınızı bu güvenli sayfadan indirebilirsiniz.\n\nAsır Solar Güneş Enerjisi Sistemleri`;
  const html = emailLayout("Teklifiniz hazır", `<p>Sayın ${escapeHtml(quote.customerName)},</p><p><strong>${escapeHtml(quote.title)}</strong></p><p style="padding:16px;background:#f1f5f2;white-space:pre-line">${escapeHtml(summary)}</p><p style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(quote.message)}</p><p><a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 24px;background:#173f35;color:#fff;text-decoration:none;border-radius:6px">Teklifi İncele</a></p><p style="font-size:13px;color:#5a6964">Teklif dosyalarınızı bu özel bağlantıdan indirebilir, teklif onayı veya revizyon talebi iletebilirsiniz. Bağlantıyı yalnızca ilgili kişilerle paylaşın.</p>`, origin);
  return { subject: `Teklifiniz hazır · Asır Solar · ${quote.quoteNumber}`, text, html };
}
export function renderQuoteTeamEmail(quote: Quote, purpose: "quote_accepted" | "quote_revision", origin: string) {
  const title = purpose === "quote_accepted" ? "Teklif kabul edildi" : "Teklif için revizyon istendi";
  const link = `${origin}/admin/talepler/${encodeURIComponent(quote.leadId)}/teklifler/${encodeURIComponent(quote.id)}`;
  const summary = `${quote.customerName}\nE-posta: ${quote.customerEmail}\nTelefon: ${quote.customerPhone}\n${quote.quoteNumber} · V${quote.version}\nİlişkili Talep: ${quote.leadReference}\nProje: ${quote.projectType}\nBedel: ${quoteMoney(quote.amountCents, quote.currency)} (${vatLabel(quote.vatMode)})`;
  const revision = purpose === "quote_revision" ? `\n\nRevizyon talebi:\n${quote.revisionMessage}` : "";
  return { subject: `${title} · ${quote.quoteNumber}`, text: `${title}\n\n${summary}${revision}\n\nPanel: ${link}`, html: emailLayout(title, `<p style="white-space:pre-line">${escapeHtml(summary)}</p>${revision ? `<p style="white-space:pre-wrap">${escapeHtml(revision)}</p>` : ""}<p><a href="${escapeHtml(link)}" style="color:#173f35">Teklifi panelde aç</a></p>`, origin) };
}
export function renderQuoteSms(quote: Pick<Quote, "projectType" | "quoteNumber">, url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error("quote_url_invalid");
  return `ASIR SOLAR ${quote.quoteNumber}: ${quote.projectType.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 100)} projeniz için teklifiniz hazır. Teklifinizi inceleyin: ${url}`;
}
