"use client";
import { useState } from "react";
import { formatDate, type LeadDetail } from "@/lib/crm/types";
import { apiRequest } from "./client";

const labels: Record<string, string> = {
  held: "Gönderim etkinleştirilmedi / onay bekliyor", pending: "Gönderim bekliyor", sending: "Gönderiliyor",
  sent: "E-posta sunucusu kabul etti", accepted: "SMS sağlayıcısı kabul etti", delivered: "Telefona teslim edildi",
  failed: "Gönderim başarısız", unknown: "Teslim durumu belirsiz — kontrol gerekli", cancelled: "İptal edildi",
};
export function NotificationStatus({ detail }: { detail: LeadDetail }) {
  const [state, setState] = useState(detail);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const current = state;
  async function refresh() {
    setBusy(true); setError("");
    try { setState(await apiRequest<LeadDetail>(`/api/admin/talepler/${detail.lead.id}`)); }
    catch (error) { setError(error instanceof Error ? error.message : "Durum alınamadı."); }
    finally { setBusy(false); }
  }
  async function retry(channel: "email" | "sms", deliveryId: string, status: string) {
    const confirmedNotSent = status === "unknown";
    if (confirmedNotSent && !window.confirm("Sağlayıcı kayıtlarını ve alıcıyı kontrol ederek önceki bildirimin teslim edilmediğini doğruladınız mı? Devam ederseniz yeni bir gönderim yapılır.")) return;
    if (status === "held" && !window.confirm("Bu bekletilen bildirimi şimdi göndermek istiyor musunuz?")) return;
    setBusy(true); setError(""); setFeedback("");
    try {
      await apiRequest(`/api/admin/talepler/${detail.lead.id}`, { method: "PATCH", body: JSON.stringify({ action: "retry-notification", channel, deliveryId, confirmedNotSent }) });
      setFeedback("Bildirim sıraya alındı. Güncel sonucu görmek için durumu yenileyin.");
      setState(await apiRequest<LeadDetail>(`/api/admin/talepler/${detail.lead.id}`));
    } catch (error) { setError(error instanceof Error ? error.message : "Bildirim gönderilemedi."); }
    finally { setBusy(false); }
  }
  if (!detail.deliveries.length && !detail.smsDeliveries.length) return null;
  return <section className="crm-panel crm-notifications">
    <h2>Ekip bildirimleri</h2>
    <p className="crm-muted">Her yeni web talebi için iki mühendise de e-posta ve SMS bildirimi hazırlanır. Gönderim bağlantısı bekleyen kayıtlar burada korunur.</p>
    {feedback && <p role="status" className="crm-success">{feedback}</p>}{error && <p role="alert" className="crm-error">{error}</p>}
    {(["email", "sms"] as const).map(channel => <div key={channel}>
      <h3>{channel === "email" ? "E-posta" : "SMS"}</h3>
      {(channel === "email" ? current.deliveries : current.smsDeliveries).map(delivery => <div className="crm-notification-row" key={delivery.id}>
        <strong>{delivery.recipient}</strong><span>{labels[delivery.status]}</span>
        {delivery.status === "failed" && <small>{delivery.retryable ? "Otomatik tekrar denenecek." : "Bağlantı veya teslimat kontrolü gerekli."}</small>}
        {delivery.status === "unknown" && <small>Mükerrer gönderimi önlemek için otomatik tekrar durduruldu.</small>}
        <small>Deneme: {delivery.attempts}{delivery.sentAt ? ` · İletim: ${formatDate(delivery.sentAt, true)}` : ""}</small>
        {"deliveredAt" in delivery && delivery.deliveredAt && <small>Teslim doğrulaması: {formatDate(delivery.deliveredAt, true)}</small>}
        {"providerId" in delivery && delivery.providerId && <small>Sağlayıcı kayıt no: {delivery.providerId}</small>}
        {delivery.errorCode && <small>Durum kodu: {delivery.errorCode}</small>}
        {["held", "failed", "unknown"].includes(delivery.status) && <button type="button" className="crm-inline-button" disabled={busy} onClick={() => retry(channel, delivery.id, delivery.status)}>{delivery.status === "held" ? "Bu bildirimi gönder" : delivery.status === "unknown" ? "Teslim edilmediğini doğruladım, tekrar gönder" : "Bu bildirimi tekrar dene"}</button>}
      </div>)}
    </div>)}
    <button type="button" className="crm-inline-button" disabled={busy} onClick={refresh}>Bildirim durumlarını yenile ↻</button>
  </section>;
}
