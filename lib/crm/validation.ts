import { projectTypes, validateEnquiry, type Enquiry } from "../enquiry.ts";
import { sources, stages, type LeadInput } from "./types.ts";

export class CrmError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CrmError("Geçersiz istek.");
  return value as Record<string, unknown>;
}
export function textField(value: unknown, label: string, max: number, required = false): string {
  if (value === undefined || value === null) { if (required) throw new CrmError(`${label} zorunludur.`); return ""; }
  if (typeof value !== "string") throw new CrmError(`${label} geçersiz.`);
  const result = value.trim();
  if ((required && !result) || result.length > max || result.includes("\0")) throw new CrmError(`${label} geçersiz veya çok uzun.`);
  return result;
}
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function parsePublicEnquiry(value: unknown): Enquiry {
  const data = record(value);
  if (data.website) throw new CrmError("Talep doğrulanamadı.");
  const parsed: Enquiry = {
    name: textField(data.name, "Ad soyad", 100, true), phone: textField(data.phone, "Telefon", 25, true),
    email: textField(data.email, "E-posta", 254, true).toLowerCase(), company: textField(data.company, "Firma", 150),
    projectType: textField(data.projectType, "Proje türü", 100, true), message: textField(data.message, "Mesaj", 1500, true), consent: data.consent === true,
  };
  const errors = validateEnquiry(parsed);
  if (Object.keys(errors).length) throw new CrmError(Object.values(errors)[0]!);
  return parsed;
}
export function parseLeadInput(value: unknown): LeadInput {
  const data = record(value);
  const name = textField(data.name, "Ad soyad", 100, true);
  if (name.length < 2) throw new CrmError("Ad soyad en az 2 karakter olmalı.");
  const phone = textField(data.phone, "Telefon", 25);
  const email = textField(data.email, "E-posta", 254).toLowerCase();
  if (!phone && !email) throw new CrmError("Telefon veya e-posta bilgilerinden en az biri gerekli.");
  if (phone && (!/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, "").length < 10 || phone.replace(/\D/g, "").length > 15)) throw new CrmError("Telefon numarası geçersiz.");
  if (email && !emailPattern.test(email)) throw new CrmError("E-posta adresi geçersiz.");
  const projectType = textField(data.projectType, "Proje türü", 100, true);
  if (!projectTypes.some((type) => type === projectType)) throw new CrmError("Proje türü geçersiz.");
  const source = sources.find((item) => item.id === data.source)?.id;
  const stage = stages.find((item) => item.id === data.stage)?.id;
  if (!source || !stage) throw new CrmError("Kaynak veya aşama geçersiz.");
  const priority = data.priority === "high" ? "high" : data.priority === "normal" ? "normal" : null;
  if (!priority) throw new CrmError("Öncelik geçersiz.");
  const nextFollowUp = textField(data.nextFollowUp, "Takip tarihi", 10) || null;
  if (nextFollowUp && (!/^\d{4}-\d{2}-\d{2}$/.test(nextFollowUp) || !Number.isFinite(Date.parse(nextFollowUp)) || new Date(nextFollowUp).toISOString().slice(0, 10) !== nextFollowUp)) throw new CrmError("Takip tarihi geçersiz.");
  const quote = textField(data.quoteAmount, "Teklif tutarı", 14);
  if (quote && !/^\d{1,10}(\.\d{1,2})?$/.test(quote)) throw new CrmError("Teklif tutarı pozitif ve en fazla iki ondalıklı olmalı.");
  const [whole = "0", decimal = ""] = quote.split(".");
  const quoteCents = quote ? Number(whole) * 100 + Number(decimal.padEnd(2, "0")) : null;
  const rejectionReason = textField(data.rejectionReason, "Red nedeni", 1000);
  if (stage === "lost" && rejectionReason.length < 3) throw new CrmError("Teklif reddedildiyse nedenini kısaca belirtin.");
  return { name, phone, email, company: textField(data.company, "Firma", 150), projectType, message: textField(data.message, "Proje bilgisi", 3000), source, stage, priority, nextFollowUp, quoteCents, rejectionReason, assigneeId: textField(data.assigneeId, "Sorumlu", 64) || null };
}
export function parseVersion(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) throw new CrmError("Kayıt sürümü geçersiz.");
  return value;
}
