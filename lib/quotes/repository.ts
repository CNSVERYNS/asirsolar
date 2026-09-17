import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getDatabase, transaction } from "../crm/database.ts";
import { tokenHash } from "../crm/auth.ts";
import { CrmError } from "../crm/validation.ts";
import { isValidEmail } from "../enquiry.ts";
import { todayInTurkey, type AdminUser } from "../crm/types.ts";
import { emailEnabled, smsEnabled, notificationRecipients, validNotificationOrigin } from "../crm/notification-config.ts";
import { quoteSendingEnabled } from "./config.ts";
import { normalizedSmsPhone, publicTokenValid } from "./validation.ts";
import type { PublicQuote, Quote, QuoteAttachment, QuoteDetail, QuoteEvent, QuoteInput } from "./types.ts";

const columns = `q.id, q.thread_id AS threadId, q.lead_id AS leadId, t.quote_number AS quoteNumber, q.version, q.edit_version AS editVersion,
 q.customer_name AS customerName, q.customer_email AS customerEmail, q.customer_phone AS customerPhone, q.project_type AS projectType,
 q.title, q.message, q.amount_cents AS amountCents, q.currency, q.vat_mode AS vatMode, q.valid_until::text AS validUntil, q.status,
 q.email_requested AS emailRequested, q.sms_requested AS smsRequested, q.sent_at AS sentAt, q.first_viewed_at AS firstViewedAt,
 q.last_viewed_at AS lastViewedAt, q.accepted_at AS acceptedAt, q.revision_requested_at AS revisionRequestedAt, q.revision_message AS revisionMessage,
 q.expired_at AS expiredAt, q.revoked_at AS revokedAt, q.created_at AS createdAt, q.updated_at AS updatedAt`;
const now = () => new Date().toISOString();
const missing = () => new CrmError("Teklif bulunamadı veya bağlantı geçersiz.", 404);
const actionable = (quote: Quote) => ["sent", "viewed"].includes(quote.status);

export async function quoteRecord(id: string): Promise<Quote> {
  const quote = await getDatabase().prepare(`SELECT ${columns} FROM asir_crm.quotes q JOIN asir_crm.quote_threads t ON t.id=q.thread_id WHERE q.id=?`).get(id) as Quote | undefined;
  if (!quote) throw missing();
  quote.attachments = await getDatabase().prepare("SELECT id, original_filename AS filename, mime_type AS mimeType, size_bytes AS sizeBytes FROM asir_crm.quote_attachments WHERE quote_id=? ORDER BY created_at,id").all(id) as QuoteAttachment[];
  return quote;
}
// Consistent lock order for drafts, actions, files and revision creation.
export async function lockQuote(id: string) {
  const before = await quoteRecord(id);
  const db = getDatabase();
  await db.prepare("SELECT id FROM leads WHERE id=? FOR UPDATE").get(before.leadId);
  await db.prepare("SELECT id FROM asir_crm.quote_threads WHERE id=? FOR UPDATE").get(before.threadId);
  await db.prepare("SELECT id FROM asir_crm.quotes WHERE id=? FOR UPDATE").get(id);
  return quoteRecord(id);
}
export async function quoteEvent(quote: Pick<Quote, "id" | "leadId" | "quoteNumber" | "version">, kind: string, content: string, actorType: QuoteEvent["actorType"], actorId: string | null = null) {
  const id = randomUUID(), createdAt = now();
  const description = `${quote.quoteNumber} · V${quote.version}: ${content}`;
  await getDatabase().prepare("INSERT INTO asir_crm.quote_events(id,quote_id,kind,content,actor_type,actor_id,created_at) VALUES(?,?,?,?,?,?,?)").run(id, quote.id, kind, content, actorType, actorId, createdAt);
  await getDatabase().prepare("INSERT INTO lead_events(id,lead_id,kind,content,actor_id,created_at) VALUES(?,?,?,?,?,?)").run(id, quote.leadId, kind, `${actorType === "customer" ? "Müşteri · " : actorType === "system" ? "Sistem · " : ""}${description}`, actorId, createdAt);
  return id;
}
async function cancelQuoteJobs(id: string) {
  for (const table of ["email_outbox", "sms_outbox"]) {
    await getDatabase().prepare(`UPDATE ${table} SET status='cancelled',retryable=false,quote_token=NULL WHERE quote_id=? AND status IN ('pending','held','failed')`).run(id);
  }
}
async function expireQuote(quote: Quote) {
  if (["sent", "viewed", "revision_requested"].includes(quote.status) && quote.validUntil < todayInTurkey()) {
    const stamp = now();
    await getDatabase().prepare("UPDATE asir_crm.quotes SET status='expired',expired_at=?,updated_at=? WHERE id=?").run(stamp, stamp, quote.id);
    await cancelQuoteJobs(quote.id);
    await quoteEvent(quote, "quote_expired", "Teklifin geçerlilik süresi doldu.", "system");
    return quoteRecord(quote.id);
  }
  return quote;
}
export async function getQuoteDetail(id: string): Promise<QuoteDetail> {
  const quote = await transaction(async () => expireQuote(await lockQuote(id)));
  const events = await getDatabase().prepare("SELECT e.id,e.kind,e.actor_type AS actorType,COALESCE(u.name,CASE WHEN e.actor_type='customer' THEN 'Müşteri' ELSE 'Sistem' END) AS actorName,e.content,e.created_at AS createdAt FROM asir_crm.quote_events e LEFT JOIN users u ON u.id=e.actor_id WHERE e.quote_id=? ORDER BY e.sequence DESC").all(id) as QuoteEvent[];
  const deliveries = await getDatabase().prepare("SELECT id,'email' AS channel,recipient,purpose,status,attempts,error_code AS errorCode,sent_at AS sentAt FROM email_outbox WHERE quote_id=? UNION ALL SELECT id,'sms' AS channel,recipient,'quote_customer' AS purpose,status,attempts,error_code AS errorCode,sent_at AS sentAt FROM sms_outbox WHERE quote_id=? ORDER BY 8 DESC NULLS FIRST").all(id, id) as QuoteDetail["deliveries"];
  return { quote, events, deliveries };
}
export async function listQuotes(leadId: string) {
  if (!await getDatabase().prepare("SELECT id FROM leads WHERE id=?").get(leadId)) throw missing();
  const rows = await getDatabase().prepare("SELECT id FROM asir_crm.quotes WHERE lead_id=? ORDER BY created_at DESC,version DESC").all(leadId) as { id: string }[];
  const result: QuoteDetail[] = [];
  for (const row of rows) result.push(await getQuoteDetail(row.id));
  return result;
}
export async function maintainQuoteJobs() {
  // Bound each cron sweep; no network/provider calls and no release of held deliveries.
  const rows = await getDatabase().prepare("SELECT id FROM asir_crm.quotes WHERE status IN ('sent','viewed','revision_requested') AND valid_until < ?::date ORDER BY valid_until LIMIT 25").all(todayInTurkey()) as { id: string }[];
  for (const row of rows) await transaction(async () => { await expireQuote(await lockQuote(row.id)); });
  for (const table of ["email_outbox", "sms_outbox"]) await getDatabase().prepare(`UPDATE ${table} SET quote_token=NULL WHERE quote_token IS NOT NULL AND (status IN ('sent','accepted','delivered','unknown','cancelled') OR (status='failed' AND retryable=false))`).run();
  return { expired: rows.length };
}
async function leadSnapshot(leadId: string) {
  const lead = await getDatabase().prepare("SELECT name,email,phone,project_type AS projectType,archived_at AS archivedAt FROM leads WHERE id=? FOR UPDATE").get(leadId) as { name: string; email: string; phone: string; projectType: string; archivedAt: string | null } | undefined;
  if (!lead) throw missing();
  if (lead.archivedAt) throw new CrmError("Önce müşteri kaydını arşivden çıkarın.", 409);
  return lead;
}
export async function createQuote(leadId: string, input: QuoteInput, actor: AdminUser, key: string, revisionOf?: string) {
  return transaction(async db => {
    const hash = createHash("sha256").update(JSON.stringify({ leadId, input, revisionOf: revisionOf ?? null })).digest("hex");
    await db.prepare("SELECT pg_advisory_xact_lock(hashtextextended(?,0))").get(`quote-create:${key}`);
    const duplicate = await db.prepare("SELECT id,creation_hash FROM asir_crm.quotes WHERE creation_key=?").get(key) as { id: string; creation_hash: string } | undefined;
    if (duplicate) {
      if (duplicate.creation_hash !== hash) throw new CrmError("Bu işlem anahtarı farklı bir taslak için kullanıldı.", 409);
      return quoteRecord(duplicate.id);
    }
    const lead = await leadSnapshot(leadId), stamp = now();
    let threadId: string, version = 1;
    if (revisionOf) {
      const parent = await lockQuote(revisionOf);
      if (parent.leadId !== leadId) throw missing();
      if (["draft", "accepted"].includes(parent.status)) throw new CrmError("Taslak veya kabul edilmiş tekliften revizyon oluşturulamaz.", 409);
      const latest = await db.prepare("SELECT id,version,status FROM asir_crm.quotes WHERE thread_id=? ORDER BY version DESC LIMIT 1").get(parent.threadId) as { id: string; version: number; status: string };
      if (latest.id !== parent.id) throw new CrmError("Bu teklifin daha yeni sürümü mevcut. En son sürümü açın.", 409);
      threadId = parent.threadId; version = latest.version + 1;
    } else {
      threadId = randomUUID();
      const sequence = await db.prepare("SELECT nextval('asir_crm.quote_number_seq') AS number").get() as { number: number };
      const number = `ASR-TKF-${todayInTurkey().slice(2).replaceAll("-", "")}-${String(sequence.number).padStart(4, "0")}`;
      await db.prepare("INSERT INTO asir_crm.quote_threads(id,lead_id,quote_number,created_at) VALUES(?,?,?,?)").run(threadId, leadId, number, stamp);
    }
    const id = randomUUID();
    await db.prepare(`INSERT INTO asir_crm.quotes(id,thread_id,lead_id,version,customer_name,customer_email,customer_phone,project_type,title,message,amount_cents,currency,vat_mode,valid_until,email_requested,sms_requested,created_by,created_at,updated_at,creation_key,creation_hash)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, threadId, leadId, version, lead.name, lead.email, lead.phone, lead.projectType, input.title, input.message, input.amountCents, input.currency, input.vatMode, input.validUntil, input.emailRequested, input.smsRequested, actor.id, stamp, stamp, key, hash);
    if (revisionOf) {
      const files = await db.prepare("SELECT id FROM asir_crm.quote_attachments WHERE quote_id=?").all(revisionOf) as { id: string }[];
      for (const file of files) await db.prepare("INSERT INTO asir_crm.quote_attachments(id,quote_id,original_filename,mime_type,size_bytes,data,sha256,created_at) SELECT ?,?,original_filename,mime_type,size_bytes,data,sha256,? FROM asir_crm.quote_attachments WHERE id=?").run(randomUUID(), id, stamp, file.id);
    }
    const quote = await quoteRecord(id);
    await quoteEvent(quote, "quote_created", revisionOf ? "Yeni revizyon taslağı oluşturuldu. Önceki sürüm korunuyor." : "Teklif taslağı oluşturuldu.", "admin", actor.id);
    return quote;
  });
}
export async function updateQuote(id: string, input: QuoteInput, editVersion: number, actor: AdminUser) {
  return transaction(async db => {
    const quote = await lockQuote(id);
    if (quote.status !== "draft" || quote.editVersion !== editVersion) throw new CrmError("Teklif değişmiş veya gönderilmiş. Güncel sürümü yükleyin.", 409);
    const lead = await leadSnapshot(quote.leadId);
    await db.prepare("UPDATE asir_crm.quotes SET title=?,message=?,amount_cents=?,currency=?,vat_mode=?,valid_until=?,email_requested=?,sms_requested=?,customer_name=?,customer_email=?,customer_phone=?,project_type=?,edit_version=edit_version+1,updated_at=? WHERE id=?").run(input.title, input.message, input.amountCents, input.currency, input.vatMode, input.validUntil, input.emailRequested, input.smsRequested, lead.name, lead.email, lead.phone, lead.projectType, now(), id);
    await quoteEvent(quote, "quote_updated_draft", "Teklif taslağı güncellendi.", "admin", actor.id);
    return quoteRecord(id);
  });
}
// A new capability is returned once. Existing links remain valid until the version is revoked.
// Only its SHA-256 hash is stored here; temporary delivery copies are handled by the private outbox.
export async function issueQuoteToken(id: string) {
  const count = await getDatabase().prepare("SELECT count(*)::int AS total FROM asir_crm.quote_tokens WHERE quote_id=?").get(id) as { total: number };
  if (count.total >= 256) throw new CrmError("Bu sürüm için bağlantı sınırına ulaşıldı. Yeni revizyon oluşturun.", 409);
  const token = randomBytes(32).toString("base64url");
  await getDatabase().prepare("INSERT INTO asir_crm.quote_tokens(token_hash,quote_id,created_at) VALUES(?,?,?)").run(tokenHash(token), id, now());
  return token;
}
export function quoteUrl(token: string) {
  if (!publicTokenValid(token)) throw missing();
  return `${validNotificationOrigin()}/teklif/${token}`;
}
export async function copyQuoteLink(id: string, actor: AdminUser) {
  return transaction(async () => {
    const quote = await expireQuote(await lockQuote(id));
    if (["draft", "revoked", "expired"].includes(quote.status)) throw new CrmError("Bu teklif için paylaşım bağlantısı oluşturulamaz.", 409);
    const url = quoteUrl(await issueQuoteToken(id));
    await quoteEvent(quote, "quote_link_created", "Paylaşım bağlantısı oluşturuldu.", "admin", actor.id);
    return { url };
  });
}
export async function sendQuote(id: string, editVersion: number, key: string, actor: AdminUser, resend = false) {
  if (!quoteSendingEnabled()) throw new CrmError("Teklif gönderimi henüz açılmadı. Taslağınız korunuyor.", 503);
  return transaction(async db => {
    await db.prepare("SELECT pg_advisory_xact_lock(hashtextextended(?,0))").get(`quote-send:${key}`);
    const quote = await expireQuote(await lockQuote(id));
    const duplicate = await db.prepare("SELECT quote_id FROM asir_crm.quote_dispatches WHERE request_key=?").get(key) as { quote_id: string } | undefined;
    if (duplicate) {
      if (duplicate.quote_id !== id) throw new CrmError("İşlem anahtarı başka teklife ait.", 409);
      return { quote, duplicate: true };
    }
    if (!resend && quote.status !== "draft") {
      if (["sent", "viewed"].includes(quote.status)) return { quote, duplicate: true };
      throw new CrmError("Bu teklif gönderime uygun değil.", 409);
    }
    if (resend && !actionable(quote)) throw new CrmError("Yalnızca yanıt bekleyen teklifler tekrar gönderilebilir.", 409);
    if (quote.editVersion !== editVersion) throw new CrmError("Teklif değişti. Güncel özeti kontrol edin.", 409);
    if (quote.validUntil < todayInTurkey()) throw new CrmError("Teklifin geçerlilik tarihi geçmiş.", 409);
    const lead = await leadSnapshot(quote.leadId);
    if (lead.name !== quote.customerName || lead.email !== quote.customerEmail || lead.phone !== quote.customerPhone || lead.projectType !== quote.projectType) throw new CrmError("Müşteri bilgileri değişti. Taslağı güncelleyin veya yeni revizyon oluşturun.", 409);
    if (!quote.emailRequested && !quote.smsRequested) throw new CrmError("En az bir gönderim kanalı seçin.");
    if (quote.emailRequested && !isValidEmail(quote.customerEmail)) throw new CrmError("Müşterinin geçerli e-posta adresini talep kaydında tamamlayın.");
    const phone = quote.smsRequested ? normalizedSmsPhone(quote.customerPhone) : "";
    validNotificationOrigin();
    if (resend) {
      const waiting = await db.prepare("SELECT id FROM email_outbox WHERE quote_id=? AND purpose='quote_customer' AND status IN ('held','pending','sending','failed','unknown') UNION ALL SELECT id FROM sms_outbox WHERE quote_id=? AND status IN ('held','pending','sending','failed','unknown') LIMIT 1").get(id, id);
      if (waiting) throw new CrmError("Bekleyen/sonucu belirsiz bildirim var. İlgili bildirimi kontrol edip yeniden deneyin.", 409);
      const recent = await db.prepare("SELECT id FROM asir_crm.quote_dispatches WHERE quote_id=? AND created_at>? LIMIT 1").get(id, new Date(Date.now() - 60000).toISOString());
      if (recent) throw new CrmError("Tekrar göndermeden önce bir dakika bekleyin.", 429);
    } else {
      const accepted = await db.prepare("SELECT id FROM asir_crm.quotes WHERE thread_id=? AND status='accepted'").get(quote.threadId);
      if (accepted) throw new CrmError("Önceki sürüm müşteri tarafından kabul edildi. Yeni gönderim durduruldu.", 409);
      const older = await db.prepare("SELECT id FROM asir_crm.quotes WHERE thread_id=? AND id<>? AND status IN ('sent','viewed','revision_requested')").all(quote.threadId, id) as { id: string }[];
      for (const old of older) await revokeLocked(await quoteRecord(old.id), actor, "Yeni sürüm gönderildi; önceki sürümün bağlantıları iptal edildi.");
      const stamp = now();
      await db.prepare("UPDATE asir_crm.quotes SET status='sent',sent_at=?,updated_at=? WHERE id=?").run(stamp, stamp, id);
      await db.prepare("UPDATE leads SET stage='proposal',quote_cents=CASE WHEN ?='TRY' THEN ? ELSE quote_cents END,version=version+1,updated_at=? WHERE id=? AND stage IN ('new','meeting','proposal')").run(quote.currency, quote.amountCents, stamp, quote.leadId);
    }
    const token = await issueQuoteToken(id), dispatch = randomUUID();
    await db.prepare("INSERT INTO asir_crm.quote_dispatches(id,quote_id,request_key,created_at) VALUES(?,?,?,?)").run(dispatch, id, key, now());
    if (quote.emailRequested) await db.prepare("INSERT INTO email_outbox(id,lead_id,quote_id,dispatch_id,quote_token,recipient,purpose,status) VALUES(?,?,?,?,?,?,'quote_customer',?)").run(randomUUID(), quote.leadId, id, dispatch, token, quote.customerEmail, emailEnabled() ? "pending" : "held");
    if (quote.smsRequested) await db.prepare("INSERT INTO sms_outbox(id,lead_id,quote_id,dispatch_id,quote_token,recipient,status) VALUES(?,?,?,?,?,?,?)").run(randomUUID(), quote.leadId, id, dispatch, token, phone, smsEnabled() ? "pending" : "held");
    await quoteEvent(quote, "quote_sent", resend ? "Teklif tekrar gönderim kuyruğuna alındı." : "Teklif paylaşıma açıldı; seçili kanallar için bildirim işleri kaydedildi.", "admin", actor.id);
    return { quote: await quoteRecord(id), duplicate: false };
  });
}
async function revokeLocked(quote: Quote, actor: AdminUser, reason = "Teklif ve tüm paylaşım bağlantıları iptal edildi.") {
  if (quote.status === "revoked") return;
  const stamp = now();
  await getDatabase().prepare("UPDATE asir_crm.quotes SET status='revoked',revoked_at=?,updated_at=? WHERE id=?").run(stamp, stamp, quote.id);
  await cancelQuoteJobs(quote.id);
  await quoteEvent(quote, "quote_revoked", reason, "admin", actor.id);
}
export async function revokeQuote(id: string, actor: AdminUser) {
  return transaction(async () => { await revokeLocked(await lockQuote(id), actor); return quoteRecord(id); });
}
async function tokenRecord(token: string) {
  if (!publicTokenValid(token)) throw missing();
  const row = await getDatabase().prepare("SELECT quote_id FROM asir_crm.quote_tokens WHERE token_hash=?").get(tokenHash(token)) as { quote_id: string } | undefined;
  if (!row) throw missing();
  const quote = await expireQuote(await lockQuote(row.quote_id));
  if (["draft", "revoked"].includes(quote.status)) throw missing();
  return quote;
}
export function publicQuote(quote: Quote): PublicQuote {
  // Explicit allowlist: no lead ID, quote ID, thread ID, email, phone, events, credentials or delivery data.
  return { quoteNumber: quote.quoteNumber, version: quote.version, customerName: quote.customerName, projectType: quote.projectType,
    title: quote.title, message: quote.message, amountCents: quote.amountCents, currency: quote.currency, vatMode: quote.vatMode, validUntil: quote.validUntil,
    status: quote.status, createdAt: quote.createdAt, sentAt: quote.sentAt, firstViewedAt: quote.firstViewedAt, lastViewedAt: quote.lastViewedAt,
    acceptedAt: quote.acceptedAt, revisionRequestedAt: quote.revisionRequestedAt, revisionMessage: quote.revisionMessage,
    expiredAt: quote.expiredAt, revokedAt: quote.revokedAt, attachments: quote.attachments };
}
export async function readPublicQuote(token: string) { return transaction(async () => publicQuote(await tokenRecord(token))); }
export async function viewPublicQuote(token: string) {
  return transaction(async db => {
    const quote = await tokenRecord(token), stamp = now();
    if (quote.status !== "expired") {
      await db.prepare("UPDATE asir_crm.quotes SET first_viewed_at=COALESCE(first_viewed_at,?),last_viewed_at=?,status=CASE WHEN status='sent' THEN 'viewed' ELSE status END WHERE id=?").run(stamp, stamp, quote.id);
      if (!quote.firstViewedAt) await quoteEvent(quote, "quote_viewed", "Müşteri teklif sayfasını ilk kez görüntüledi.", "customer");
    }
    return publicQuote(await quoteRecord(quote.id));
  });
}
export async function actOnPublicQuote(token: string, action: "accept" | "revision", revision = "") {
  return transaction(async db => {
    const quote = await tokenRecord(token);
    const next = action === "accept" ? "accepted" : "revision_requested";
    if (quote.status === next) {
      if (action === "revision" && quote.revisionMessage !== revision) throw new CrmError("Revizyon talebiniz zaten alındı. Ek bilgi için ekibimizle iletişime geçin.", 409);
      return { quote: publicQuote(quote), leadId: quote.leadId, duplicate: true };
    }
    if (!actionable(quote)) throw new CrmError("Bu teklif artık yanıt kabul etmiyor.", 409);
    const stamp = now();
    await db.prepare(`UPDATE asir_crm.quotes SET status=?,${action === "accept" ? "accepted_at" : "revision_requested_at"}=?,revision_message=?,updated_at=? WHERE id=?`).run(next, stamp, revision, stamp, quote.id);
    if (action === "accept") await db.prepare("UPDATE leads SET stage='won',quote_cents=CASE WHEN ?='TRY' THEN ? ELSE quote_cents END,version=version+1,updated_at=? WHERE id=? AND stage NOT IN ('in_progress','completed')").run(quote.currency, quote.amountCents, stamp, quote.leadId);
    const eventId = await quoteEvent(quote, action === "accept" ? "quote_accepted" : "quote_revision_requested", action === "accept" ? "Müşteri teklif onayını verdi." : `Müşteri revizyon istedi: ${revision}`, "customer");
    await cancelQuoteJobs(quote.id);
    for (const account of notificationRecipients) await db.prepare("INSERT INTO email_outbox(id,lead_id,quote_id,dispatch_id,recipient,purpose,status) VALUES(?,?,?,?,?,?,?)").run(randomUUID(), quote.leadId, quote.id, eventId, account.email, action === "accept" ? "quote_accepted" : "quote_revision", quoteSendingEnabled() && emailEnabled() ? "pending" : "held");
    return { quote: publicQuote(await quoteRecord(quote.id)), leadId: quote.leadId, duplicate: false };
  });
}
export async function publicAttachment(token: string, attachmentId: string) {
  return transaction(async () => {
    const quote = await tokenRecord(token);
    if (quote.status === "expired") throw missing();
    return attachmentRecord(quote.id, attachmentId);
  });
}
export async function attachmentRecord(quoteId: string, id: string) {
  const file = await getDatabase().prepare("SELECT data,original_filename AS filename,mime_type AS mimeType FROM asir_crm.quote_attachments WHERE quote_id=? AND id=?").get(quoteId, id) as { data: Uint8Array; filename: string; mimeType: string } | undefined;
  if (!file) throw missing();
  return file;
}
