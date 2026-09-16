import { api, currentAdmin } from "@/lib/crm/http";
import { projectImageVisibility } from "@/lib/projects/repository";
import { projectImageEtag, projectImageVariant, projectImageWidth } from "@/lib/projects/image-variants";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return api(async () => {
    const { id } = await context.params;
    const visibility = await projectImageVisibility(id);
    if (!visibility || (!visibility.published && !await currentAdmin())) return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
    const width = projectImageWidth(new URL(request.url).searchParams.get("w"));
    const etag = projectImageEtag(id, width);
    const headers = { "Content-Type": "image/webp", "Cache-Control": visibility.published ? "private, no-cache" : "private, no-store", "ETag": etag, "X-Content-Type-Options": "nosniff", "Vary": "Cookie" };
    if (visibility.published && request.headers.get("if-none-match")?.split(",").some(value => value.trim().replace(/^W\//, "") === etag)) return new Response(null, { status: 304, headers });
    const image = await projectImageVariant(id, width);
    if (!image) return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
    return new Response(new Uint8Array(image), { headers });
  });
}
