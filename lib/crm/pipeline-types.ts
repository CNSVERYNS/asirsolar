import type { Currency, QuoteStatus } from "../quotes/types.ts";
export const pipelineStages = [
  { id: "new", label: "Yeni Talep" }, { id: "reviewing", label: "İnceleniyor" },
  { id: "preparing", label: "Teklif Hazırlanıyor" }, { id: "sent", label: "Teklif Gönderildi" },
  { id: "viewed", label: "Teklif Görüntülendi" }, { id: "revision_requested", label: "Revizyon İstendi" },
  { id: "accepted", label: "Teklif Kabul Edildi" }, { id: "lost", label: "Kaybedildi" },
] as const;
export type PipelineStage = typeof pipelineStages[number]["id"];
export const manualPipelineStages: PipelineStage[] = ["new", "reviewing", "preparing", "lost"];
export const lostReasons = ["Fiyat", "Rakip firma", "Proje ertelendi", "Müşteri vazgeçti", "Ulaşılamadı", "Diğer"] as const;
export type PipelineCard = {
  id: string; reference: string; name: string; phone: string; email: string; projectType: string;
  createdAt: string; lastActivityAt: string; lastActivity: string; stage: PipelineStage; version: number;
  quoteId: string | null; quoteNumber: string | null; quoteVersion: number | null; quoteStatus: QuoteStatus | null;
  quoteAmount: number | null; quoteCurrency: Currency | null; quoteSentAt: string | null;
  hasQuote: boolean; hasViewed: boolean; hasAccepted: boolean; systemControlled: boolean;
};
export type PipelineData = {
  generatedAt: string;
  cards: PipelineCard[]; total: number; page: number; pageSize: number;
  counts: Record<PipelineStage, number>;
  summary: { open: number; sent: number; accepted: number; amounts: Record<Currency, number> };
};
export function pipelineLabel(stage: PipelineStage) { return pipelineStages.find(item => item.id === stage)!.label; }
export function relativeActivity(value: string, current: number) {
  const minutes = Math.max(0, Math.floor((current - Date.parse(value)) / 60000));
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} saat önce`;
  return `${Math.floor(minutes / 1440)} gün önce`;
}
