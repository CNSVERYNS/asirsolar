import { api, json, limit, readJson, requireAdmin, verifyOrigin } from "@/lib/crm/http";
import { record, textField } from "@/lib/crm/validation";
import { createQuote, listQuotes, quoteCapabilities } from "@/lib/quotes/server";
import { parseQuote, requestKey } from "@/lib/quotes/validation";

export const runtime = "nodejs";
export async function GET(request: Request) {
  return api(async () => {
    await requireAdmin();
    return json({ quotes: await listQuotes(textField(new URL(request.url).searchParams.get("leadId"), "Talep", 64, true)), capabilities: quoteCapabilities() });
  });
}
export async function POST(request: Request) {
  return api(async () => {
    verifyOrigin(request); const user = await requireAdmin(); await limit(`quote-create:${user.id}`, 60, 3600);
    const data = record(await readJson(request));
    const quote = await createQuote(textField(data.leadId, "Talep", 64, true), parseQuote(data), user, requestKey(request.headers.get("idempotency-key")), textField(data.revisionOf, "Revizyon", 64) || undefined);
    return json({ quote }, 201);
  });
}
