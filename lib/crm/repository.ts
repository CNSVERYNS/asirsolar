import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Enquiry } from "../enquiry.ts";
import { emailEnabled, smsEnabled, notificationRecipients } from "./notification-config.ts";
import { getDatabase, transaction } from "./database.ts";
import { CrmError } from "./validation.ts";
import { stageLabel, sourceLabel, todayInTurkey, type AdminUser, type DashboardData, type EmailDelivery, type Lead, type LeadDetail, type LeadEvent, type LeadInput } from "./types.ts";
const leadColumns = `l.id, l.reference, l.name, l.phone, l.email, l.company, l.project_type AS projectType, l.message, l.source, l.stage,
  l.assignee_id AS assigneeId, u.name AS assigneeName, l.priority, l.next_follow_up AS nextFollowUp, l.quote_cents AS quoteCents,
  l.rejection_reason AS rejectionReason, l.created_at AS createdAt, l.updated_at AS updatedAt, l.archived_at AS archivedAt, l.version`;
async function checkAssignee(assignee: string | null) {
    if (assignee && !await getDatabase().prepare("SELECT id FROM users WHERE id = ?").get(assignee))
        throw new CrmError("Sorumlu kişi bulunamadı.");
}
async function event(leadId: string, actorId: string | null, kind: string, content: string) {
    await getDatabase().prepare("INSERT INTO lead_events (id, lead_id, actor_id, kind, content, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(randomUUID(), leadId, actorId, kind, content, new Date().toISOString());
}
async function insertLead(input: LeadInput, actor: AdminUser | null, submission?: {
    key: string;
    hash: string;
}) {
    const db = getDatabase();
    await checkAssignee(input.assigneeId);
    const id = randomUUID();
    const now = new Date().toISOString();
    const reference = `ASR-${now.slice(2, 10).replaceAll("-", "")}-${randomBytes(4).toString("hex").toUpperCase()}`;
    await db.prepare(`INSERT INTO leads (id, reference, name, phone, email, company, project_type, message, source, stage, assignee_id, priority, next_follow_up, quote_cents, rejection_reason, consent_at, consent_version, submission_key, payload_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, reference, input.name, input.phone, input.email, input.company, input.projectType, input.message, input.source, input.stage, input.assigneeId, input.priority, input.nextFollowUp, input.quoteCents, input.rejectionReason, submission ? now : null, submission ? "website-enquiry-2026-09" : null, submission?.key ?? null, submission?.hash ?? null, now, now);
    await event(id, actor?.id ?? null, "created", `${sourceLabel(input.source)} üzerinden müşteri kaydı oluşturuldu.`);
    return { id, reference };
}
export async function createWebsiteLead(enquiry: Enquiry, submissionKey: string) {
    const hash = createHash("sha256").update(JSON.stringify(enquiry)).digest("hex");
    return await transaction(async (db) => {
        await db.prepare("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))").get(`submission:${submissionKey}`);
        const existing = await db.prepare("SELECT id, reference, payload_hash FROM leads WHERE submission_key = ?").get(submissionKey) as {
            id: string;
            reference: string;
            payload_hash: string;
        } | undefined;
        if (existing) {
            if (existing.payload_hash !== hash)
                throw new CrmError("Bu gönderim anahtarı farklı bilgilerle kullanılmış. Sayfayı yenileyip tekrar deneyin.", 409);
            return { id: existing.id, reference: existing.reference, duplicate: true };
        }
        const created = await insertLead({ ...enquiry, source: "website", stage: "new", assigneeId: null, priority: "normal", nextFollowUp: null, quoteCents: null, rejectionReason: "" }, null, { key: submissionKey, hash });
        for (const account of notificationRecipients) {
            await db.prepare("INSERT INTO email_outbox (id, lead_id, recipient, status) VALUES (?, ?, ?, ?)").run(randomUUID(), created.id, account.email, emailEnabled() ? "pending" : "held");
            await db.prepare("INSERT INTO sms_outbox (id, lead_id, recipient, status) VALUES (?, ?, ?, ?)").run(randomUUID(), created.id, account.phone, smsEnabled() ? "pending" : "held");
        }
        return { ...created, duplicate: false };
    });
}
export async function createManualLead(input: LeadInput, actor: AdminUser) {
    if (input.source === "website")
        throw new CrmError("Web sitesi kaynağı yalnızca iletişim formundan oluşturulur.");
    const result = await transaction(async () => await insertLead(input, actor));
    return await getLead(result.id);
}
export async function getLead(id: string): Promise<LeadDetail> {
    const db = getDatabase();
    const lead = await db.prepare(`SELECT ${leadColumns} FROM leads l LEFT JOIN users u ON u.id = l.assignee_id WHERE l.id = ?`).get(id) as Lead | undefined;
    if (!lead)
        throw new CrmError("Müşteri kaydı bulunamadı.", 404);
    const events = await db.prepare("SELECT e.id, e.kind, e.content, COALESCE(u.name, 'Web sitesi') AS actorName, e.created_at AS createdAt FROM lead_events e LEFT JOIN users u ON u.id = e.actor_id WHERE e.lead_id = ? ORDER BY e.created_at DESC, e.sequence DESC").all(id) as LeadEvent[];
    const deliveries = await db.prepare("SELECT id, recipient, status, attempts, sent_at AS sentAt, error_code AS errorCode, retryable FROM email_outbox WHERE lead_id = ? ORDER BY recipient").all(id) as EmailDelivery[];
    const smsDeliveries = await db.prepare("SELECT id, recipient, status, attempts, sent_at AS sentAt, delivered_at AS deliveredAt, error_code AS errorCode, retryable, provider_id AS providerId FROM sms_outbox WHERE lead_id = ? ORDER BY recipient").all(id) as LeadDetail["smsDeliveries"];
    return { lead, events, deliveries, smsDeliveries };
}
export async function listLeads(params: URLSearchParams): Promise<DashboardData> {
    const db = getDatabase();
    const where = [params.get("archived") === "true" ? "l.archived_at IS NOT NULL" : "l.archived_at IS NULL"];
    const values: (string | number)[] = [];
    const query = params.get("q")?.trim().slice(0, 120);
    if (query) {
        const escaped = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
        where.push("(l.name ILIKE ? ESCAPE '\\' OR l.email ILIKE ? ESCAPE '\\' OR l.phone ILIKE ? ESCAPE '\\' OR l.company ILIKE ? ESCAPE '\\' OR l.reference ILIKE ? ESCAPE '\\')");
        values.push(...Array<string>(5).fill(escaped));
    }
    for (const [key, column] of [["stage", "stage"], ["source", "source"], ["priority", "priority"]]) {
        const value = params.get(key);
        if (value && value !== "all") {
            where.push(`l.${column} = ?`);
            values.push(value);
        }
    }
    const assignee = params.get("assignee");
    if (assignee === "unassigned")
        where.push("l.assignee_id IS NULL");
    else if (assignee && assignee !== "all") {
        where.push("l.assignee_id = ?");
        values.push(assignee);
    }
    if (params.get("followUp") === "due") {
        where.push("l.next_follow_up <= ? AND l.stage NOT IN ('lost','completed')");
        values.push(todayInTurkey());
    }
    const predicate = where.join(" AND ");
    const total = (await db.prepare(`SELECT COUNT(*) AS count FROM leads l WHERE ${predicate}`).get(...values) as {
        count: number;
    }).count;
    const pageSize = 40;
    const requestedPage = Number(params.get("page") || 1);
    const page = Math.min(Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1), Math.max(1, Math.ceil(total / pageSize)));
    const leads = await db.prepare(`SELECT ${leadColumns} FROM leads l LEFT JOIN users u ON u.id = l.assignee_id WHERE ${predicate} ORDER BY l.created_at DESC, l.id LIMIT ? OFFSET ?`).all(...values, pageSize, (page - 1) * pageSize) as Lead[];
    const summary = await db.prepare(`SELECT COUNT(*) AS total, COALESCE(SUM((stage='new')::int),0) AS new, COALESCE(SUM((stage='proposal')::int),0) AS proposals, COALESCE(SUM((stage IN ('won','in_progress','completed'))::int),0) AS won,
    COALESCE(SUM((next_follow_up <= ? AND stage NOT IN ('lost','completed'))::int),0) AS overdue,
    COALESCE(SUM(CASE WHEN stage IN ('won','in_progress','completed') THEN COALESCE(quote_cents,0) ELSE 0 END),0)::bigint AS wonQuoteCents FROM leads WHERE archived_at IS NULL`).get(todayInTurkey()) as DashboardData["summary"];
    return { leads, total, page, pageSize, summary };
}
export async function updateLead(id: string, input: LeadInput, version: number, actor: AdminUser) {
    await transaction(async (db) => {
        await db.prepare("SELECT id FROM leads WHERE id=? FOR UPDATE").get(id);
        const before = (await getLead(id)).lead;
        if (before.version !== version)
            throw new CrmError("Bu kayıt başka bir işlemle güncellendi. Son bilgileri yükleyip değişikliğinizi tekrar uygulayın.", 409);
        if (before.archivedAt)
            throw new CrmError("Düzenlemek için önce kaydı arşivden çıkarın.");
        if (before.source !== input.source)
            throw new CrmError("Kaydın geliş kaynağı değiştirilemez.");
        await checkAssignee(input.assigneeId);
        const changes: string[] = [];
        if (before.stage !== input.stage)
            changes.push(`${stageLabel(before.stage)} → ${stageLabel(input.stage)}`);
        const labels: Partial<Record<keyof LeadInput, string>> = { name: "Ad soyad", phone: "Telefon", email: "E-posta", company: "Firma", projectType: "Proje türü", message: "Proje bilgisi", assigneeId: "Sorumlu", priority: "Öncelik", nextFollowUp: "Takip tarihi", quoteCents: "Teklif tutarı", rejectionReason: "Red nedeni" };
        for (const [key, label] of Object.entries(labels)) {
            const field = key as keyof LeadInput;
            if (before[field as keyof Lead] !== input[field])
                changes.push(`${label} güncellendi.`);
        }
        if (!changes.length)
            return;
        await db.prepare(`UPDATE leads SET name=?,phone=?,email=?,company=?,project_type=?,message=?,stage=?,assignee_id=?,priority=?,next_follow_up=?,quote_cents=?,rejection_reason=?,updated_at=?,version=version+1 WHERE id=? AND version=?`).run(input.name, input.phone, input.email, input.company, input.projectType, input.message, input.stage, input.assigneeId, input.priority, input.nextFollowUp, input.quoteCents, input.rejectionReason, new Date().toISOString(), id, version);
        await event(id, actor.id, before.stage !== input.stage ? "stage" : "updated", changes.join("\n") + (input.stage === "lost" && before.stage !== "lost" ? `\nRed nedeni: ${input.rejectionReason}` : ""));
    });
    return await getLead(id);
}
export async function addLeadNote(id: string, note: string, actor: AdminUser) {
    await transaction(async () => { await getLead(id); await event(id, actor.id, "note", note); });
    return await getLead(id);
}
export async function archiveLead(id: string, archive: boolean, version: number, actor: AdminUser) {
    await transaction(async (db) => {
        await db.prepare("SELECT id FROM leads WHERE id=? FOR UPDATE").get(id);
        const lead = (await getLead(id)).lead;
        if (lead.version !== version)
            throw new CrmError("Kayıt değişti. Güncel kaydı yükleyip tekrar deneyin.", 409);
        if (Boolean(lead.archivedAt) === archive)
            return;
        await db.prepare("UPDATE leads SET archived_at=?, updated_at=?, version=version+1 WHERE id=?").run(archive ? new Date().toISOString() : null, new Date().toISOString(), id);
        await event(id, actor.id, "archived", archive ? "Kayıt arşive taşındı." : "Kayıt arşivden çıkarıldı.");
    });
    return await getLead(id);
}
