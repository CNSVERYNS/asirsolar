export const quoteStatuses = {
  draft: "Taslak", sent: "Teklif gönderildi", viewed: "Görüntülendi", accepted: "Teklif kabul edildi",
  revision_requested: "Revizyon istendi", rejected: "Reddedildi", expired: "Süresi doldu", revoked: "İptal edildi",
} as const;
export type QuoteStatus = keyof typeof quoteStatuses;
export type Currency = "TRY" | "USD" | "EUR";
export type VatMode = "included" | "excluded";
export const MAX_QUOTE_FILE_BYTES = 3 * 1024 * 1024;
export const MAX_QUOTE_FILES = 5;
export type QuoteInput = { title: string; message: string; amountCents: number; currency: Currency; vatMode: VatMode; validUntil: string; emailRequested: boolean; smsRequested: boolean };
export type QuoteAttachment = { id: string; filename: string; mimeType: string; sizeBytes: number };
export type PublicQuote = Omit<QuoteInput, "emailRequested" | "smsRequested"> & {
  quoteNumber: string; version: number; customerName: string; projectType: string; status: QuoteStatus;
  createdAt: string; sentAt: string | null; firstViewedAt: string | null; lastViewedAt: string | null;
  acceptedAt: string | null; revisionRequestedAt: string | null; revisionMessage: string;
  expiredAt: string | null; revokedAt: string | null; attachments: QuoteAttachment[];
};
export type Quote = PublicQuote & { id: string; threadId: string; leadId: string; editVersion: number; customerEmail: string; customerPhone: string; updatedAt: string; emailRequested: boolean; smsRequested: boolean };
export type QuoteEvent = { id: string; kind: string; actorType: "admin" | "customer" | "system"; actorName: string; content: string; createdAt: string };
export type QuoteDelivery = { id: string; channel: "email" | "sms"; recipient: string; purpose: string; status: string; attempts: number; errorCode: string | null; sentAt: string | null };
export type QuoteDetail = { quote: Quote; events: QuoteEvent[]; deliveries: QuoteDelivery[] };
export type QuoteCapabilities = { sending: boolean; email: boolean; sms: boolean };
export function quoteMoney(cents: number, currency: Currency) { return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(cents / 100); }
export function quoteDate(value: string) { return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "Europe/Istanbul" }).format(new Date(value.length === 10 ? value + "T12:00:00+03:00" : value)); }
export function vatLabel(mode: VatMode) { return mode === "included" ? "KDV Dahil" : "KDV Hariç"; }
export function defaultQuoteMessage(fullName: string, projectType: string) {
  return `Merhaba ${fullName},\n\n${projectType} projeniz için teknik ve mali çalışmamızı tamamladık. Size özel hazırladığımız teklifimizi aşağıda inceleyebilirsiniz.\n\nSorularınız veya revizyon talepleriniz için bu e-postayı yanıtlayabilir veya ekibimizle iletişime geçebilirsiniz.\n\nSaygılarımızla,\nAsır Solar Güneş Enerjisi Sistemleri`;
}
export function defaultQuoteDate() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + 7 * 86400000));
}
