import { api, json, requireAdmin, verifyOrigin } from "@/lib/crm/http";
import { removeProjectImage } from "@/lib/projects/repository";
export async function DELETE(request: Request, context: { params: Promise<{ id: string; imageId: string }> }) {
  return api(async () => {
    verifyOrigin(request); await requireAdmin(); const { id, imageId } = await context.params;
    await removeProjectImage(id, imageId); return json({ ok: true });
  });
}
