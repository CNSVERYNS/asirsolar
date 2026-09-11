import { randomUUID } from "node:crypto";
import { getDatabase, transaction } from "./database.ts";
import { flushEmailOutbox } from "./email.ts";
import { flushSmsOutbox, refreshSmsReports } from "./sms.ts";
import { emailEnabled, smsEnabled } from "./notification-config.ts";
import { CrmError } from "./validation.ts";

export async function processNotifications(leadId?: string) {
  const db = getDatabase();
  if (!leadId) {
    const claimed = await db.prepare("INSERT INTO notification_worker(id,last_started_at) VALUES ('worker',?) ON CONFLICT(id) DO UPDATE SET last_started_at=EXCLUDED.last_started_at,last_error=NULL WHERE notification_worker.last_started_at < ? RETURNING id").get(Date.now(), Date.now() - 60000);
    if (!claimed) return { configured: emailEnabled() || smsEnabled(), skipped: true, sent: 0, accepted: 0 };
  }
  const outcomes = await Promise.allSettled([flushEmailOutbox(leadId), flushSmsOutbox(leadId), ...(leadId ? [] : [refreshSmsReports()])]);
  const hasError = outcomes.some(result => result.status === "rejected" || ("error" in result.value && !!result.value.error) || ("errors" in result.value && !!result.value.errors));
  if (!leadId) await db.prepare("UPDATE notification_worker SET last_finished_at=?,last_error=? WHERE id='worker'").run(Date.now(), hasError ? "worker_channel_error" : null);
  return {
    configured: emailEnabled() || smsEnabled(),
    email: outcomes[0].status === "fulfilled" ? outcomes[0].value : { error: "email_worker_error" },
    sms: outcomes[1].status === "fulfilled" ? outcomes[1].value : { error: "sms_worker_error" },
    reports: outcomes[2]?.status === "fulfilled" ? outcomes[2].value : outcomes[2] ? { error: "sms_report_worker_error" } : undefined,
  };
}

export async function retryNotification(leadId: string, channel: "email" | "sms", deliveryId: string, actorId: string, confirmedNotSent = false) {
  if (!(channel === "email" ? emailEnabled() : smsEnabled())) throw new CrmError("Bu bildirim kanalı henüz etkinleştirilmedi.", 503);
  const table = channel === "email" ? "email_outbox" : "sms_outbox";
  return transaction(async db => {
    const row = await db.prepare(`SELECT status FROM ${table} WHERE id=? AND lead_id=? FOR UPDATE`).get(deliveryId, leadId) as { status: string } | undefined;
    if (!row) throw new CrmError("Bildirim bulunamadı.", 404);
    if (!["held", "failed", "unknown"].includes(row.status)) throw new CrmError("Bu bildirim yeniden gönderilemez. Güncel durumu kontrol edin.", 409);
    if (row.status === "unknown" && !confirmedNotSent) throw new CrmError("Önce sağlayıcıda ve alıcıda bildirimin teslim edilmediğini doğrulayın.", 409);
    await db.prepare(`UPDATE ${table} SET status='pending',retryable=true,attempts=0,error_code=NULL,available_at=0,claim_token=NULL${channel === "sms" ? ",provider_id=NULL,report_checked_at=0" : ""} WHERE id=? AND lead_id=?`).run(deliveryId, leadId);
    await db.prepare("INSERT INTO lead_events(id,lead_id,actor_id,kind,content,created_at) VALUES (?,?,?,?,?,?)").run(randomUUID(), leadId, actorId, "notification", `${channel === "email" ? "E-posta" : "SMS"} bildirimi kullanıcı tarafından gönderim sırasına alındı.${row.status === "unknown" ? " Önceki teslimatın gerçekleşmediği doğrulandı." : ""}`, new Date().toISOString());
  });
}
