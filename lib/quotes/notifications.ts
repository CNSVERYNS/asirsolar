import { getDatabase, transaction } from "../crm/database.ts";
import { tokenHash } from "../crm/auth.ts";
import { DeliveryError } from "../crm/notification-errors.ts";
import { validNotificationOrigin } from "../crm/notification-config.ts";
import { todayInTurkey, type EmailPurpose } from "../crm/types.ts";
import { isValidEmail } from "../enquiry.ts";
import { quoteSendingEnabled } from "./config.ts";
import { quoteRecord, quoteEvent, quoteUrl, issueQuoteToken } from "./repository.ts";
import { renderQuoteEmail, renderQuoteTeamEmail, renderQuoteSms } from "./templates.ts";

type QuoteJob = { quote_id: string; quote_token: string | null; recipient: string; purpose?: EmailPurpose };
export async function quoteJobAllowed(id: string, customer: boolean) {
  const quote = await quoteRecord(id);
  return quoteSendingEnabled() && (customer ? ["sent", "viewed"].includes(quote.status) && quote.validUntil >= todayInTurkey() : !!quote.sentAt);
}
async function jobUrl(job: QuoteJob) {
  if (!job.quote_token || !await getDatabase().prepare("SELECT token_hash FROM asir_crm.quote_tokens WHERE quote_id=? AND token_hash=?").get(job.quote_id, tokenHash(job.quote_token))) throw new DeliveryError("quote_link_unavailable");
  return quoteUrl(job.quote_token);
}
export async function prepareQuoteEmail(job: QuoteJob, messageId: string) {
  const quote = await quoteRecord(job.quote_id), origin = validNotificationOrigin();
  if (!isValidEmail(job.recipient)) throw new DeliveryError("email_recipient_invalid");
  if (job.purpose === "quote_customer" && job.recipient !== quote.customerEmail) throw new DeliveryError("quote_recipient_mismatch");
  if (job.purpose !== "quote_customer" && job.purpose !== "quote_accepted" && job.purpose !== "quote_revision") throw new DeliveryError("quote_purpose_invalid");
  return {
    from: process.env.CRM_EMAIL_FROM!, to: { address: job.recipient, name: "" },
    replyTo: process.env.CRM_EMAIL_REPLY_TO || process.env.CRM_EMAIL_FROM!, messageId,
    ...(job.purpose === "quote_customer" ? renderQuoteEmail(quote, await jobUrl(job), origin) : renderQuoteTeamEmail(quote, job.purpose, origin)),
  };
}
export async function prepareQuoteSms(job: QuoteJob) { return renderQuoteSms(await quoteRecord(job.quote_id), await jobUrl(job)); }
export async function finishQuoteDelivery(channel: "email" | "sms", id: string, claim: string, quoteId: string | null, providerId?: string) {
  return transaction(async db => {
    const table = channel === "email" ? "email_outbox" : "sms_outbox";
    const result = await db.prepare(`UPDATE ${table} SET status=?,sent_at=?,error_code=NULL,claim_token=NULL,quote_token=NULL ${channel === "sms" ? ",provider_id=?" : ""} WHERE id=? AND claim_token=? RETURNING id`).get(channel === "email" ? "sent" : "accepted", new Date().toISOString(), ...(channel === "sms" ? [providerId] : []), id, claim);
    if (result && quoteId) await quoteEvent(await quoteRecord(quoteId), channel === "email" ? "quote_email_accepted_by_provider" : "quote_sms_accepted_by_provider", `${channel === "email" ? "E-posta" : "SMS"} sağlayıcı tarafından kabul edildi. Bildirim: ${id}`, "system");
  });
}
export async function refreshQuoteJobToken(table: "email_outbox" | "sms_outbox", id: string, quoteId: string, customer: boolean) {
  if (customer) await getDatabase().prepare(`UPDATE ${table} SET quote_token=? WHERE id=?`).run(await issueQuoteToken(quoteId), id);
}
