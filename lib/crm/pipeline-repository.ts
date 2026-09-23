import { randomUUID } from "node:crypto";
import { getDatabase, transaction } from "./database.ts";
import { CrmError, parseVersion, record, textField } from "./validation.ts";
import { todayInTurkey, type AdminUser } from "./types.ts";
import { lostReasons, manualPipelineStages, pipelineLabel, pipelineStages, type PipelineCard, type PipelineData, type PipelineStage } from "./pipeline-types.ts";

// One bounded SQL request for cards, filtered counts and totals. No per-card application queries.
// Lateral lookups use the existing lead FK indexes and the activity/latest-quote indexes.
const base = `WITH facts AS (
 SELECT l.id,l.reference_number AS reference,l.name,l.phone,l.email,l.project_type,l.created_at,l.version,l.stage AS legacy_stage,l.pipeline_phase,
 q.id AS quote_id,q.quote_number,q.version AS quote_version,
 CASE WHEN q.status IN ('sent','viewed','revision_requested') AND q.valid_until<?::date THEN 'expired' ELSE q.status END AS quote_status,
 q.amount_cents AS quote_amount,q.currency AS quote_currency,q.sent_at AS quote_sent_at,
 COALESCE(q.last_viewed_at,q.updated_at) AS quote_activity,
 greatest(l.updated_at,l.created_at,COALESCE(ev.created_at,l.created_at),COALESCE(q.updated_at,l.created_at),COALESCE(q.last_viewed_at,l.created_at)) AS last_activity_at,
 CASE WHEN q.last_viewed_at IS NOT NULL AND q.last_viewed_at>=greatest(l.updated_at,COALESCE(ev.created_at,l.created_at),q.updated_at) THEN q.quote_number || ' · teklif görüntülendi'
      WHEN qe.id IS NOT NULL THEN eq.quote_number || ' · V' || eq.version || ': ' || CASE WHEN qe.kind IN ('quote_email_accepted_by_provider','quote_sms_accepted_by_provider') THEN split_part(qe.content,' Bildirim: ',1) ELSE qe.content END ELSE COALESCE(ev.content,'Talep oluşturuldu.') END AS last_activity,
 q.id IS NOT NULL AS has_quote,COALESCE(totals.has_viewed,false) AS has_viewed,COALESCE(totals.has_accepted,false) AS quote_accepted,
 COALESCE(totals.has_live,false) AS has_live,
 COALESCE(totals.try_amount,0)::bigint AS try_amount,COALESCE(totals.usd_amount,0)::bigint AS usd_amount,COALESCE(totals.eur_amount,0)::bigint AS eur_amount
 FROM asir_crm.leads l
 LEFT JOIN LATERAL (SELECT * FROM asir_crm.quotes WHERE lead_id=l.id ORDER BY created_at DESC,id DESC LIMIT 1) q ON true
 LEFT JOIN LATERAL (SELECT * FROM asir_crm.lead_events WHERE lead_id=l.id ORDER BY created_at DESC,sequence DESC LIMIT 1) ev ON true
 LEFT JOIN asir_crm.quote_events qe ON qe.id=ev.id LEFT JOIN asir_crm.quotes eq ON eq.id=qe.quote_id
 LEFT JOIN LATERAL (
   SELECT bool_or(first_viewed_at IS NOT NULL) AS has_viewed,bool_or(status='accepted') AS has_accepted,
     bool_or(status IN ('sent','viewed','revision_requested') AND valid_until>=?::date) AS has_live,
     sum(amount_cents) FILTER(WHERE currency='TRY' AND status IN ('draft','sent','viewed','revision_requested') AND valid_until>=?::date) AS try_amount,
     sum(amount_cents) FILTER(WHERE currency='USD' AND status IN ('draft','sent','viewed','revision_requested') AND valid_until>=?::date) AS usd_amount,
     sum(amount_cents) FILTER(WHERE currency='EUR' AND status IN ('draft','sent','viewed','revision_requested') AND valid_until>=?::date) AS eur_amount
   FROM asir_crm.quotes existing WHERE existing.lead_id=l.id
   AND NOT EXISTS(SELECT 1 FROM asir_crm.quotes newer WHERE newer.thread_id=existing.thread_id AND newer.version>existing.version)
 ) totals ON true WHERE l.archived_at IS NULL
), classified AS (
 SELECT *, (quote_accepted OR legacy_stage IN ('won','in_progress','completed')) AS has_accepted,
 (quote_accepted OR has_live OR legacy_stage IN ('won','in_progress','completed')) AS system_controlled,
 CASE WHEN quote_accepted OR legacy_stage IN ('won','in_progress','completed') THEN 'accepted'
 WHEN legacy_stage='lost' THEN 'lost'
 WHEN quote_status='draft' THEN 'preparing'
 WHEN quote_status IN ('sent','viewed','revision_requested') THEN quote_status
 WHEN quote_id IS NOT NULL AND quote_status IN ('expired','revoked','rejected','sent','viewed','revision_requested') THEN 'reviewing'
 WHEN legacy_stage='proposal' THEN 'sent'
 WHEN legacy_stage='meeting' THEN CASE WHEN pipeline_phase='preparing' THEN 'preparing' ELSE 'reviewing' END
 ELSE 'new' END AS stage FROM facts
)`;
function filter(params: URLSearchParams) {
  const clauses: string[] = [], values: (string | number)[] = [];
  const query = textField(params.get("q"), "Arama", 120);
  if (/^ASR-TLP-[1-9][0-9]{0,11}$/i.test(query)) { clauses.push("reference=?"); values.push(query.toUpperCase()); }
  else if (/^ASR-TKLF-[1-9][0-9]{0,11}$/i.test(query)) { clauses.push("EXISTS(SELECT 1 FROM asir_crm.quotes reference_quote WHERE reference_quote.lead_id=classified.id AND reference_quote.quote_number=?)"); values.push(query.toUpperCase()); }
  else if (query) {
    const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
    clauses.push(`(reference ILIKE ? ESCAPE '\\' OR name ILIKE ? ESCAPE '\\' OR email ILIKE ? ESCAPE '\\' OR phone ILIKE ? ESCAPE '\\' OR project_type ILIKE ? ESCAPE '\\'
      OR EXISTS(SELECT 1 FROM asir_crm.quotes search_quote WHERE search_quote.lead_id=classified.id AND (search_quote.quote_number ILIKE ? ESCAPE '\\' OR search_quote.legacy_quote_number ILIKE ? ESCAPE '\\'))
      OR EXISTS(SELECT 1 FROM asir_crm.leads legacy WHERE legacy.id=classified.id AND legacy.reference ILIKE ? ESCAPE '\\'))`);
    values.push(...Array<string>(8).fill(pattern));
  }
  const project = textField(params.get("project"), "Proje", 100);
  if (project) { clauses.push("project_type=?"); values.push(project); }
  const stage = params.get("stage");
  if (stage) { if (!pipelineStages.some(item => item.id === stage)) throw new CrmError("Aşama geçersiz."); clauses.push("stage=?"); values.push(stage); }
  for (const [key, column] of [["quote", "has_quote"], ["viewed", "has_viewed"], ["accepted", "has_accepted"]]) {
    const value = params.get(key);
    if (value) { if (!["yes", "no"].includes(value)) throw new CrmError("Filtre geçersiz."); clauses.push(`${column}=${value === "yes" ? "true" : "false"}`); }
  }
  for (const [key, op] of [["from", ">="], ["to", "<="]]) {
    const date = params.get(key);
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new CrmError("Tarih geçersiz.");
      clauses.push(`(created_at::timestamptz AT TIME ZONE 'Europe/Istanbul')::date ${op} ?::date`); values.push(date);
    }
  }
  if (params.get("from") && params.get("to") && params.get("from")! > params.get("to")!) throw new CrmError("Tarih aralığı geçersiz.");
  return { predicate: clauses.length ? clauses.join(" AND ") : "true", values };
}
const cardColumns = `id,reference,name,phone,email,project_type AS "projectType",created_at AS "createdAt",version,stage,
 last_activity_at AS "lastActivityAt",last_activity AS "lastActivity",quote_id AS "quoteId",quote_number AS "quoteNumber",quote_version AS "quoteVersion",
 quote_status AS "quoteStatus",quote_amount AS "quoteAmount",quote_currency AS "quoteCurrency",quote_sent_at AS "quoteSentAt",
 has_quote AS "hasQuote",has_viewed AS "hasViewed",has_accepted AS "hasAccepted",system_controlled AS "systemControlled"`;
const dates = () => Array<string>(5).fill(todayInTurkey());
export async function listPipeline(params: URLSearchParams): Promise<PipelineData> {
  const { predicate, values } = filter(params);
  const sort = params.get("sort") || "activity";
  const orders: Record<string, string> = { activity: "last_activity_at DESC,id", newest: "created_at DESC,id", oldest: "created_at,id", amount: "quote_currency ASC NULLS LAST,quote_amount DESC NULLS LAST,id" };
  if (!Object.hasOwn(orders, sort)) throw new CrmError("Sıralama geçersiz.");
  const page = Number(params.get("page") || 1), pageSize = 200;
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw new CrmError("Sayfa geçersiz.");
  const row = await getDatabase().prepare(`${base}, filtered AS (SELECT * FROM classified WHERE ${predicate}),
    cards AS (SELECT ${cardColumns} FROM filtered ORDER BY ${orders[sort]} LIMIT ? OFFSET ?),
    stage_counts AS (SELECT stage,count(*)::int AS total FROM filtered GROUP BY stage)
    SELECT COALESCE((SELECT jsonb_agg(cards) FROM cards),'[]'::jsonb) AS cards,
      COALESCE((SELECT jsonb_object_agg(stage,total) FROM stage_counts),'{}'::jsonb) AS counts,
      count(*)::int AS total,count(*) FILTER(WHERE stage NOT IN ('accepted','lost'))::int AS open,
      count(*) FILTER(WHERE quote_sent_at IS NOT NULL OR legacy_stage='proposal')::int AS sent,
      count(*) FILTER(WHERE has_accepted)::int AS accepted,
      COALESCE(sum(try_amount) FILTER(WHERE stage NOT IN ('accepted','lost')),0)::bigint AS try,
      COALESCE(sum(usd_amount) FILTER(WHERE stage NOT IN ('accepted','lost')),0)::bigint AS usd,
      COALESCE(sum(eur_amount) FILTER(WHERE stage NOT IN ('accepted','lost')),0)::bigint AS eur FROM filtered`).get(...dates(), ...values, pageSize, (page - 1) * pageSize) as { cards: PipelineCard[]; counts: Partial<PipelineData["counts"]>; total: number; open: number; sent: number; accepted: number; try: number; usd: number; eur: number };
  return { generatedAt: new Date().toISOString(), cards: row.cards, total: row.total, page, pageSize,
    counts: Object.fromEntries(pipelineStages.map(item => [item.id, row.counts[item.id] ?? 0])) as PipelineData["counts"],
    summary: { open: row.open, sent: row.sent, accepted: row.accepted, amounts: { TRY: row.try, USD: row.usd, EUR: row.eur } } };
}
export async function movePipeline(id: string, value: unknown, actor: AdminUser) {
  const data = record(value), target = textField(data.stage, "Aşama", 30) as PipelineStage;
  if (!manualPipelineStages.includes(target)) throw new CrmError("Bu aşama gerçek teklif olaylarıyla otomatik güncellenir.", 409);
  const version = parseVersion(data.version), expectedStage = textField(data.expectedStage, "Mevcut aşama", 30, true);
  const expectedActivity = textField(data.expectedActivity, "Son aktivite", 40, true);
  const reason = textField(data.reason, "Kayıp nedeni", 50), note = textField(data.note, "Not", 1000);
  if (target === "lost" && !lostReasons.some(item => item === reason)) throw new CrmError("Kaybedilme nedenini seçin.");
  if (note && reason !== "Diğer") throw new CrmError("Not yalnızca Diğer seçeneğinde kullanılabilir.");
  return transaction(async db => {
    if (!await db.prepare("SELECT id FROM leads WHERE id=? AND archived_at IS NULL FOR UPDATE").get(id)) throw new CrmError("Talep bulunamadı.", 404);
    const card = await db.prepare(`${base} SELECT ${cardColumns} FROM classified WHERE id=?`).get(...dates(), id) as PipelineCard;
    if (card.version !== version || card.stage !== expectedStage || card.lastActivityAt !== expectedActivity) throw new CrmError("Talep güncellendi. Panoyu yenileyip tekrar deneyin.", 409);
    if (card.stage === target) return { duplicate: true };
    if (card.hasAccepted || (target !== "lost" && card.systemControlled)) throw new CrmError("Aktif teklifin aşaması müşteri/teklif olaylarıyla yönetilir. Talep detayını açın.", 409);
    if (card.quoteStatus === "draft" && target !== "preparing" && target !== "lost") throw new CrmError("Önce mevcut teklif taslağını tamamlayın veya iptal edin.", 409);
    const stage = target === "lost" ? "lost" : target === "new" ? "new" : "meeting";
    const rejection = target === "lost" ? reason + (note ? `: ${note}` : "") : "";
    const stamp = new Date().toISOString();
    await db.prepare("UPDATE leads SET stage=?,pipeline_phase=?,rejection_reason=?,version=version+1,updated_at=? WHERE id=?").run(stage, target === "lost" ? "reviewing" : target, rejection, stamp, id);
    const description = `${card.reference}: ${pipelineLabel(card.stage)} → ${pipelineLabel(target)}` + (rejection ? " · " + rejection : "");
    await db.prepare("INSERT INTO lead_events(id,lead_id,actor_id,kind,content,created_at) VALUES(?,?,?,'pipeline_stage',?,?)").run(randomUUID(), id, actor.id, description, stamp);
    return { duplicate: false };
  });
}
