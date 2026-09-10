export const stages = [
  { id: "new", label: "Yeni talep", color: "purple" },
  { id: "meeting", label: "Ön görüşme yapıldı", color: "blue" },
  { id: "proposal", label: "Teklif gönderildi", color: "amber" },
  { id: "won", label: "Teklif onaylandı", color: "green" },
  { id: "in_progress", label: "Uygulama aşamasında", color: "blue" },
  { id: "completed", label: "Tamamlandı", color: "green" },
  { id: "lost", label: "Teklif reddedildi", color: "red" },
] as const;
export const sources = [
  { id: "website", label: "Web sitesi" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "phone", label: "Telefon" },
  { id: "email", label: "E-posta" },
  { id: "referral", label: "Referans" },
  { id: "other", label: "Diğer" },
] as const;
export type Stage = typeof stages[number]["id"];
export type Source = typeof sources[number]["id"];
export type AdminUser = { id: string; name: string; email: string };
export type Lead = {
  id: string; reference: string; name: string; phone: string; email: string;
  company: string; projectType: string; message: string; source: Source;
  stage: Stage; assigneeId: string | null; assigneeName: string | null;
  priority: "normal" | "high"; nextFollowUp: string | null;
  quoteCents: number | null; rejectionReason: string;
  createdAt: string; updatedAt: string; archivedAt: string | null; version: number;
};
export type LeadEvent = { id: string; kind: string; content: string; actorName: string; createdAt: string };
export type EmailDelivery = { id: string; recipient: string; status: "pending" | "sending" | "sent" | "failed"; attempts: number; sentAt: string | null; errorCode: string | null };
export type LeadDetail = { lead: Lead; events: LeadEvent[]; deliveries: EmailDelivery[] };
export type DashboardData = {
  leads: Lead[]; total: number; page: number; pageSize: number;
  summary: { total: number; new: number; proposals: number; won: number; overdue: number; wonQuoteCents: number };
};
export type LeadInput = {
  name: string; phone: string; email: string; company: string; projectType: string;
  message: string; source: Source; stage: Stage; assigneeId: string | null;
  priority: "normal" | "high"; nextFollowUp: string | null;
  quoteCents: number | null; rejectionReason: string;
};
export function stageLabel(stage: string) { return stages.find((item) => item.id === stage)?.label ?? stage; }
export function sourceLabel(source: string) { return sources.find((item) => item.id === source)?.label ?? source; }
export function todayInTurkey() { return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" }).format(new Date()); }
export function formatDate(value: string | null, time = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit" } as const : {}), timeZone: "Europe/Istanbul" }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value));
}
export function formatMoney(cents: number | null) { return cents === null ? "Belirtilmedi" : new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(cents / 100); }
