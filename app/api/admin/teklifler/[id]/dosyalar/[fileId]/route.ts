import { api, json, limit, requireAdmin, verifyOrigin } from "@/lib/crm/http";
import { parseVersion } from "@/lib/crm/validation";
import { attachmentRecord, removeQuoteAttachment } from "@/lib/quotes/server";
import { quoteFileResponse } from "@/lib/quotes/http";
type Context = { params: Promise<{ id: string; fileId: string }> };
export const runtime = "nodejs";
export async function GET(_request: Request, context: Context) {
  return api(async () => { await requireAdmin(); const { id, fileId } = await context.params; return quoteFileResponse(await attachmentRecord(id, fileId)); });
}
export async function DELETE(request: Request, context: Context) {
  return api(async () => {
    verifyOrigin(request); const user = await requireAdmin(); await limit(`quote-file:${user.id}`, 60, 3600);
    const { id, fileId } = await context.params;
    return json({ quote: await removeQuoteAttachment(id, fileId, parseVersion(Number(request.headers.get("x-edit-version"))), user) });
  });
}
