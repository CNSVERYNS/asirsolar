import { after } from "next/server";
import { api, json, limit, readJson, requireAdmin, verifyOrigin } from "@/lib/crm/http";
import { CrmError, parseVersion, record, textField } from "@/lib/crm/validation";
import { copyQuoteLink, getQuoteDetail, quoteCapabilities, revokeQuote, sendQuote, updateQuote } from "@/lib/quotes/server";
import { parseQuote, requestKey } from "@/lib/quotes/validation";
import { processNotifications, retryNotification } from "@/lib/crm/notifications.server";
type Context = { params: Promise<{ id: string }> };
export const runtime = "nodejs";
export const maxDuration = 60;
function flush(leadId: string) { after(async () => { try { await processNotifications(leadId); } catch { console.error("Quote notifications remain queued."); } }); }
export async function GET(_request: Request, context: Context) {
  return api(async () => { await requireAdmin(); return json({ ...await getQuoteDetail((await context.params).id), capabilities: quoteCapabilities() }); });
}
export async function PATCH(request: Request, context: Context) {
  return api(async () => {
    verifyOrigin(request); const user = await requireAdmin(); await limit(`quote-edit:${user.id}`, 180, 3600);
    const { id } = await context.params, data = record(await readJson(request));
    if (data.action === "update") return json({ quote: await updateQuote(id, parseQuote(data), parseVersion(data.editVersion), user) });
    if (data.action === "link") return json(await copyQuoteLink(id, user));
    if (data.action === "revoke") return json({ quote: await revokeQuote(id, user) });
    if (data.action === "send" || data.action === "resend") {
      const result = await sendQuote(id, parseVersion(data.editVersion), requestKey(request.headers.get("idempotency-key")), user, data.action === "resend");
      if (!result.duplicate) flush(result.quote.leadId);
      return json(result);
    }
    if (data.action === "retry") {
      const detail = await getQuoteDetail(id), deliveryId = textField(data.deliveryId, "Bildirim", 64, true);
      const delivery = detail.deliveries.find(row => row.id === deliveryId && row.channel === data.channel);
      if (!delivery) throw new CrmError("Bildirim bulunamadı.", 404);
      await limit(`quote-retry:${id}`, 8, 300);
      await retryNotification(detail.quote.leadId, delivery.channel, deliveryId, user.id, data.confirmedNotSent === true);
      flush(detail.quote.leadId);
      return json({ ok: true });
    }
    throw new CrmError("İşlem tanınmadı.");
  });
}
