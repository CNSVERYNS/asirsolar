import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";
import { getDatabase } from "./database.ts";
import { getLead } from "./repository.ts";
import { emailEnabled, emailProvider, validNotificationOrigin } from "./notification-config.ts";
import { DeliveryError, retryAt } from "./notification-errors.ts";
import { isValidEmail } from "../enquiry.ts";
import { sendZeptoMail, type TransactionalEmail } from "./zeptomail.ts";
import { renderNotificationEmail } from "./notification-templates.ts";
import type { EmailPurpose } from "./types.ts";
export { emailConfigured } from "./notification-config.ts";
export async function flushEmailOutbox(leadId?: string, retry = false) {
    if (!emailEnabled())
        return { configured: false, sent: 0 };
    const db = getDatabase();
    if (retry && leadId)
        await db.prepare("UPDATE email_outbox SET available_at=0 WHERE lead_id=? AND status IN ('pending','failed') AND retryable=true").run(leadId);
    const now = Date.now();
    await db.prepare("UPDATE email_outbox SET status='unknown', retryable=false, claim_token=NULL, error_code='interrupted' WHERE status='sending' AND claimed_at < ?").run(now - 5 * 60 * 1000);
    const candidates = await db.prepare(`SELECT id FROM email_outbox WHERE status IN ('pending','failed') AND retryable=true AND attempts < 6 AND available_at <= ? ${leadId ? "AND lead_id = ?" : ""} ORDER BY sequence LIMIT 4`).all(...(leadId ? [now, leadId] : [now])) as {
        id: string;
    }[];
    if (!candidates.length)
        return { configured: true, sent: 0 };
    const port = Number(process.env.CRM_SMTP_PORT || 587);
    const transport = emailProvider() === "zeptomail" ? null : nodemailer.createTransport({
        host: process.env.CRM_SMTP_HOST, port, secure: port === 465, requireTLS: port !== 465,
        auth: { user: process.env.CRM_SMTP_USER, pass: process.env.CRM_SMTP_PASSWORD },
        connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 8000,
        disableFileAccess: true, disableUrlAccess: true,
    });
    try {
    const results = await Promise.allSettled(candidates.map(async candidate => {
        const claim = randomUUID();
        const row = await db.prepare("UPDATE email_outbox SET status='sending', attempts=attempts+1, claimed_at=?, claim_token=? WHERE id=? AND status IN ('pending','failed') AND retryable=true AND attempts < 6 AND available_at <= ? RETURNING lead_id, recipient, purpose, attempts").get(Date.now(), claim, candidate.id, Date.now()) as {
            lead_id: string;
            recipient: string;
            purpose: EmailPurpose;
            attempts: number;
        } | undefined;
        if (!row)
            return false;
        let accepted = false;
        try {
            const { lead } = await getLead(row.lead_id);
            const origin = validNotificationOrigin();
            if (!isValidEmail(row.recipient) || (row.purpose === "team" && !isValidEmail(lead.email))) throw new DeliveryError("email_recipient_invalid");
            const outgoing: TransactionalEmail = {
                from: process.env.CRM_EMAIL_FROM!, to: { address: row.recipient, name: "" },
                replyTo: row.purpose === "customer_receipt" ? process.env.CRM_EMAIL_REPLY_TO || process.env.CRM_EMAIL_FROM! : { address: lead.email, name: "" },
                messageId: `<${candidate.id}@${new URL(origin).hostname}>`,
                ...renderNotificationEmail(row.purpose, lead, origin),
            };
            if (transport) {
                const message = await transport.sendMail({ ...outgoing, headers: { "Auto-Submitted": "auto-generated", "X-Auto-Response-Suppress": "All" } });
                if (!message.accepted?.includes(row.recipient) || message.rejected?.length)
                    throw Object.assign(new Error("recipient_rejected"), { code: "EENVELOPE", responseCode: 550 });
            } else await sendZeptoMail(outgoing, candidate.id);
            accepted = true;
            await db.prepare("UPDATE email_outbox SET status='sent', sent_at=?, error_code=NULL, claim_token=NULL WHERE id=? AND claim_token=?").run(new Date().toISOString(), candidate.id, claim);
            return true;
        }
        catch (error) {
            if (error instanceof DeliveryError) {
                const uncertain = accepted || error.uncertain;
                await db.prepare("UPDATE email_outbox SET status=?, retryable=?, error_code=?, available_at=?, claim_token=NULL WHERE id=? AND claim_token=?").run(uncertain ? "unknown" : "failed", !uncertain && error.retryable && row.attempts < 6, error.code, retryAt(row.attempts), candidate.id, claim);
                return false;
            }
            const details = error as { code?: string; command?: string; responseCode?: number };
            const code = String(details.code || "delivery_failed").replace(/[^\w-]/g, "").slice(0, 60);
            const smtpRejected = typeof details.responseCode === "number" && details.responseCode >= 400;
            const beforeData = details.command !== "DATA" && (["ECONNECTION", "EDNS", "EAUTH", "EENVELOPE"].includes(code) || ["CONN", "EHLO", "STARTTLS", "AUTH", "MAIL FROM", "RCPT TO"].includes(details.command || ""));
            const uncertain = accepted || (!smtpRejected && !beforeData);
            const retryable = !uncertain && code !== "EAUTH" && (!smtpRejected || details.responseCode! < 500) && row.attempts < 6;
            await db.prepare("UPDATE email_outbox SET status=?, retryable=?, error_code=?, available_at=?, claim_token=NULL WHERE id=? AND claim_token=?").run(uncertain ? "unknown" : "failed", retryable, code, retryAt(row.attempts), candidate.id, claim);
            return false;
        }
    }));
    return { configured: true, sent: results.filter(result => result.status === "fulfilled" && result.value).length, errors: results.filter(result => result.status === "rejected").length };
    } finally { transport?.close(); }
}
