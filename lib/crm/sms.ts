import { randomUUID } from "node:crypto";
import { getDatabase } from "./database.ts";
import { smsEnabled, smsConfigured, validNotificationOrigin } from "./notification-config.ts";
import { DeliveryError, retryAt } from "./notification-errors.ts";
import { readNetgsmReports, sendNetgsmSms } from "./netgsm.ts";

export async function flushSmsOutbox(leadId?: string) {
  if (!smsEnabled()) return { configured: false, accepted: 0 };
  const db = getDatabase();
  await db.prepare("UPDATE sms_outbox SET status='unknown', retryable=false, claim_token=NULL, error_code='interrupted' WHERE status='sending' AND claimed_at < ?").run(Date.now() - 5 * 60 * 1000);
  const candidates = await db.prepare(`SELECT id FROM sms_outbox WHERE status IN ('pending','failed') AND retryable=true AND attempts < 6 AND available_at <= ? ${leadId ? "AND lead_id=?" : ""} ORDER BY sequence LIMIT 4`).all(Date.now(), ...(leadId ? [leadId] : [])) as { id: string }[];
  const results = await Promise.allSettled(candidates.map(async candidate => {
    const claim = randomUUID();
    const row = await db.prepare("UPDATE sms_outbox SET status='sending', attempts=attempts+1, claimed_at=?, claim_token=? WHERE id=? AND status IN ('pending','failed') AND retryable=true AND attempts < 6 AND available_at <= ? RETURNING lead_id, recipient, attempts").get(Date.now(), claim, candidate.id, Date.now()) as { lead_id: string; recipient: string; attempts: number } | undefined;
    if (!row) return false;
    let providerId: string | undefined;
    try {
      const lead = await db.prepare("SELECT reference FROM leads WHERE id=?").get(row.lead_id) as { reference: string };
      const origin = validNotificationOrigin();
      providerId = await sendNetgsmSms(row.recipient, `Asır Solar: Yeni keşif talebi ${lead.reference}. Detay: ${origin}/admin/talepler/${row.lead_id}`, candidate.id);
      await db.prepare("UPDATE sms_outbox SET status='accepted', provider_id=?, sent_at=?, error_code=NULL, claim_token=NULL WHERE id=? AND claim_token=?").run(providerId, new Date().toISOString(), candidate.id, claim);
      return true;
    } catch (error) {
      const failure = error instanceof DeliveryError ? error : new DeliveryError("sms_processing_unknown", false, true);
      const uncertain = !!providerId || failure.uncertain;
      await db.prepare("UPDATE sms_outbox SET status=?, retryable=?, provider_id=?, error_code=?, available_at=?, claim_token=NULL WHERE id=? AND claim_token=?").run(uncertain ? "unknown" : "failed", !uncertain && failure.retryable && row.attempts < 6, providerId ?? null, failure.code, retryAt(row.attempts), candidate.id, claim);
      return false;
    }
  }));
  return { configured: true, accepted: results.filter(result => result.status === "fulfilled" && result.value).length, errors: results.filter(result => result.status === "rejected").length };
}

export async function refreshSmsReports() {
  if (!smsConfigured()) return { delivered: 0 };
  const db = getDatabase();
  // Reserve a report batch; concurrent workers cannot claim the same rows.
  const rows = await db.prepare("UPDATE sms_outbox SET report_checked_at=? WHERE id IN (SELECT id FROM sms_outbox WHERE status IN ('accepted','unknown') AND provider_id IS NOT NULL AND report_checked_at < ? ORDER BY report_checked_at LIMIT 40 FOR UPDATE SKIP LOCKED) RETURNING id, recipient, provider_id").all(Date.now(), Date.now() - 120000) as { id: string; recipient: string; provider_id: string }[];
  if (!rows.length) return { delivered: 0 };
  let delivered = 0;
  try {
    const reports = await readNetgsmReports(rows.map(row => row.provider_id));
    for (const row of rows) {
      const report = reports.find(report => report.jobid === row.provider_id && report.number === row.recipient.slice(-10));
      if (!report) continue;
      if (report.status === 1) {
        await db.prepare("UPDATE sms_outbox SET status='delivered', delivered_at=?, error_code=NULL, retryable=false WHERE id=? AND status IN ('accepted','unknown')").run(new Date().toISOString(), row.id);
        delivered++;
      } else if ([2, 3, 4, 11, 12, 13, 14, 15, 16, 17, 22].includes(report.status)) {
        await db.prepare("UPDATE sms_outbox SET status='failed', error_code=?, retryable=false WHERE id=? AND status IN ('accepted','unknown')").run(`sms_status_${report.status}_${report.errorCode}`, row.id);
      }
    }
  } catch { return { delivered, error: "sms_report_unavailable" }; }
  return { delivered };
}
