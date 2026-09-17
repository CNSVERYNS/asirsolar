import { after } from "next/server";
import { api, clientBucket, json, limit, readJson, verifyOrigin } from "@/lib/crm/http";
import { CrmError, record } from "@/lib/crm/validation";
import { actOnPublicQuote, readPublicQuote, viewPublicQuote } from "@/lib/quotes/server";
import { customerRevision } from "@/lib/quotes/validation";
import { processNotifications } from "@/lib/crm/notifications.server";
type Context = { params: Promise<{ token: string }> };
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request, context: Context) {
  return api(async () => { await limit(`quote-read:${clientBucket(request)}`, 300, 900); return json({ quote: await readPublicQuote((await context.params).token) }); });
}
export async function POST(request: Request, context: Context) {
  return api(async () => {
    verifyOrigin(request); await limit(`quote-action:${clientBucket(request)}`, 120, 900);
    const { token } = await context.params, data = record(await readJson(request));
    if (data.action === "view") return json({ quote: await viewPublicQuote(token) });
    if (data.action !== "accept" && data.action !== "revision") throw new CrmError("İşlem geçersiz.");
    if (data.action === "accept" && data.confirmed !== true) throw new CrmError("Teklif onayını doğrulayın.");
    const result = await actOnPublicQuote(token, data.action, data.action === "revision" ? customerRevision(data.message) : "");
    if (!result.duplicate) after(async () => { try { await processNotifications(result.leadId); } catch { console.error("Quote response notifications remain queued."); } });
    // The internal lead ID is used only for the server worker, never serialized.
    return json({ quote: result.quote });
  });
}
