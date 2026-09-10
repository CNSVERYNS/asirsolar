import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";
import { getDatabase, transaction } from "./database.ts";
import { getLead } from "./repository.ts";
export function emailConfigured() {
    return Boolean(process.env.CRM_SMTP_HOST && process.env.CRM_SMTP_USER && process.env.CRM_SMTP_PASSWORD && process.env.CRM_EMAIL_FROM && process.env.APP_ORIGIN);
}
export async function flushEmailOutbox(leadId?: string, retry = false) {
    if (!emailConfigured())
        return { configured: false, sent: 0 };
    const db = getDatabase();
    if (retry && leadId)
        await db.prepare("UPDATE email_outbox SET available_at=0 WHERE lead_id=? AND status IN ('pending','failed')").run(leadId);
    const now = Date.now();
    await db.prepare("UPDATE email_outbox SET status='failed', claim_token=NULL, error_code='interrupted' WHERE status='sending' AND claimed_at < ?").run(now - 5 * 60 * 1000);
    const candidates = await db.prepare(`SELECT id FROM email_outbox WHERE status IN ('pending','failed') AND available_at <= ? ${leadId ? "AND lead_id = ?" : ""} ORDER BY sequence LIMIT 2`).all(...(leadId ? [now, leadId] : [now])) as {
        id: string;
    }[];
    if (!candidates.length)
        return { configured: true, sent: 0 };
    const port = Number(process.env.CRM_SMTP_PORT || 587);
    const transport = nodemailer.createTransport({
        host: process.env.CRM_SMTP_HOST, port, secure: port === 465, requireTLS: port !== 465,
        auth: { user: process.env.CRM_SMTP_USER, pass: process.env.CRM_SMTP_PASSWORD },
        connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000,
        disableFileAccess: true, disableUrlAccess: true,
    });
    let sent = 0;
    for (const candidate of candidates) {
        const claim = randomUUID();
        const row = await transaction(async (connection) => await connection.prepare("UPDATE email_outbox SET status='sending', attempts=attempts+1, claimed_at=?, claim_token=? WHERE id=? AND status IN ('pending','failed') AND available_at <= ? RETURNING lead_id, recipient, attempts").get(Date.now(), claim, candidate.id, Date.now())) as {
            lead_id: string;
            recipient: string;
            attempts: number;
        } | undefined;
        if (!row)
            continue;
        try {
            const { lead } = await getLead(row.lead_id);
            const origin = new URL(process.env.APP_ORIGIN!).origin;
            const message = await transport.sendMail({
                from: process.env.CRM_EMAIL_FROM, to: row.recipient, replyTo: lead.email,
                messageId: `<${candidate.id}@${new URL(origin).hostname}>`,
                subject: `Yeni keşif talebi · ${lead.reference}`,
                text: `Web sitesinden yeni bir talep geldi.\n\nAd Soyad: ${lead.name}\nFirma: ${lead.company || "—"}\nTelefon: ${lead.phone}\nE-posta: ${lead.email}\nProje: ${lead.projectType}\n\n${lead.message}\n\nPanelde aç: ${origin}/admin/talepler/${lead.id}\n\nTalep e-posta bildirimi öncesinde güvenle kaydedilmiştir.`,
            });
            if (!message.accepted?.length || message.rejected?.length)
                throw new Error("recipient_rejected");
            await db.prepare("UPDATE email_outbox SET status='sent', sent_at=?, error_code=NULL, claim_token=NULL WHERE id=? AND claim_token=?").run(new Date().toISOString(), candidate.id, claim);
            sent++;
        }
        catch (error) {
            const code = error && typeof error === "object" && "code" in error ? String(error.code) : "delivery_failed";
            await db.prepare("UPDATE email_outbox SET status='failed', error_code=?, available_at=?, claim_token=NULL WHERE id=? AND claim_token=?").run(code.slice(0, 60), Date.now() + Math.min(3600000, 60000 * 2 ** Math.min(row.attempts, 6)), candidate.id, claim);
        }
    }
    transport.close();
    return { configured: true, sent };
}
