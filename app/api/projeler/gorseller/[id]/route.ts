import { api, currentAdmin } from "@/lib/crm/http";
import { getProjectImage } from "@/lib/projects/repository";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return api(async () => {
    const { id } = await context.params;
    const image = await getProjectImage(id, Boolean(await currentAdmin()));
    if (!image) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(image.data), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  });
}
