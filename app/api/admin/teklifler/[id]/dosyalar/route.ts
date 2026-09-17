import { api, json, limit, requireAdmin, verifyOrigin } from "@/lib/crm/http";
import { parseVersion } from "@/lib/crm/validation";
import { addQuoteAttachment } from "@/lib/quotes/server";
import { readQuoteUpload } from "@/lib/quotes/http";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return api(async () => {
    verifyOrigin(request); const user = await requireAdmin(); await limit(`quote-file:${user.id}`, 60, 3600);
    const { bytes, mime, filename } = await readQuoteUpload(request);
    return json({ quote: await addQuoteAttachment((await context.params).id, bytes, mime, filename, parseVersion(Number(request.headers.get("x-edit-version"))), user) }, 201);
  });
}
