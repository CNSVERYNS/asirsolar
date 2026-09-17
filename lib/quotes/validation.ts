import { CrmError, record, textField } from "../crm/validation.ts";
import { todayInTurkey } from "../crm/types.ts";
import type { QuoteInput } from "./types.ts";

export function requestKey(value: unknown) {
  if (typeof value !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)) throw new CrmError("İşlem anahtarı geçersiz. Sayfayı yenileyin.");
  return value;
}
export function parseQuote(value: unknown): QuoteInput {
  const data = record(value);
  const title = textField(data.title, "Teklif başlığı", 180, true);
  if (/[\u0000-\u001f\u007f]/.test(title)) throw new CrmError("Teklif başlığı tek satır olmalıdır.");
  const message = textField(data.message, "Mesaj", 6000, true);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(message)) throw new CrmError("Mesaj geçersiz karakter içeriyor.");
  const amount = textField(data.amount, "Teklif tutarı", 14, true);
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(amount)) throw new CrmError("Tutar pozitif ve en fazla iki ondalıklı olmalıdır.");
  const [whole, fraction = ""] = amount.split(".");
  const amountCents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (amountCents < 1 || amountCents > 999999999999) throw new CrmError("Teklif tutarı sınır dışında.");
  if (data.currency !== "TRY" && data.currency !== "USD" && data.currency !== "EUR") throw new CrmError("Para birimi geçersiz.");
  if (data.vatMode !== "included" && data.vatMode !== "excluded") throw new CrmError("KDV seçimi geçersiz.");
  const validUntil = textField(data.validUntil, "Geçerlilik tarihi", 10, true);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(validUntil) || !Number.isFinite(Date.parse(validUntil)) || new Date(validUntil).toISOString().slice(0, 10) !== validUntil || validUntil < todayInTurkey() || validUntil > String(Number(todayInTurkey().slice(0, 4)) + 2) + todayInTurkey().slice(4)) throw new CrmError("Geçerlilik tarihi bugün ile iki yıl sonrası arasında olmalıdır.");
  if (typeof data.emailRequested !== "boolean" || typeof data.smsRequested !== "boolean") throw new CrmError("Gönderim kanallarını seçin.");
  return { title, message, amountCents, currency: data.currency, vatMode: data.vatMode, validUntil, emailRequested: data.emailRequested, smsRequested: data.smsRequested };
}
export function publicTokenValid(token: string) { return /^[A-Za-z0-9_-]{43}$/.test(token); }
export function customerRevision(value: unknown) {
  const text = textField(value, "Revizyon talebi", 2000, true);
  if (text.length < 3 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) throw new CrmError("Revizyon talebinizi en az 3 karakterle belirtin.");
  return text;
}
export function normalizedSmsPhone(phone: string) {
  const digits = phone.replace(/[\s().+-]/g, "");
  const local = digits.startsWith("90") && digits.length === 12 ? digits.slice(2) : digits.startsWith("0") && digits.length === 11 ? digits.slice(1) : digits;
  if (!/^5\d{9}$/.test(local)) throw new CrmError("SMS için geçerli bir Türkiye cep telefonu gerekli.");
  return "+90" + local;
}
