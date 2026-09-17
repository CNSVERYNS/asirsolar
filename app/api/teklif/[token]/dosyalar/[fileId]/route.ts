import { api, clientBucket, limit } from "@/lib/crm/http";
import { publicAttachment } from "@/lib/quotes/server";
import { quoteFileResponse } from "@/lib/quotes/http";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ token: string; fileId: string }> }) {
  return api(async () => {
    await limit(`quote-download:${clientBucket(request)}`, 120, 900);
    const { token, fileId } = await context.params;
    return quoteFileResponse(await publicAttachment(token, fileId));
  });
}
