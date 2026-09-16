import { api, json, limit, requireAdmin, verifyOrigin } from "@/lib/crm/http";
import { CrmError } from "@/lib/crm/validation";
import { addProjectImage } from "@/lib/projects/repository";
import { MAX_IMAGE_BYTES } from "@/lib/projects/types";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return api(async () => {
    verifyOrigin(request); const user = await requireAdmin();
    await limit(`project-image:${user.id}`, 100, 900);
    if (!/^image\/(jpeg|png|webp)$/.test(request.headers.get("content-type") || "")) throw new CrmError("JPG, PNG veya WebP görseli seçin.", 415);
    if (Number(request.headers.get("content-length") || 0) > MAX_IMAGE_BYTES) throw new CrmError("Her görsel en fazla 3 MB olabilir.", 413);
    const reader = request.body?.getReader();
    if (!reader) throw new CrmError("Görsel seçin.");
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > MAX_IMAGE_BYTES) { await reader.cancel(); throw new CrmError("Her görsel en fazla 3 MB olabilir.", 413); }
      chunks.push(chunk.value);
    }
    return json({ image: await addProjectImage((await context.params).id, Buffer.concat(chunks)) }, 201);
  });
}
