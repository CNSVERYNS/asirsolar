import { api, json, limit, readJson, requireAdmin, verifyOrigin } from "@/lib/crm/http";
import { listPipeline, movePipeline } from "@/lib/crm/pipeline.server";
import { record, textField } from "@/lib/crm/validation";
export async function GET(request: Request) {
  return api(async () => { const user = await requireAdmin(); await limit(`pipeline-read:${user.id}`, 240, 60); return json(await listPipeline(new URL(request.url).searchParams)); });
}
export async function PATCH(request: Request) {
  return api(async () => {
    const user = await requireAdmin(); verifyOrigin(request); await limit(`pipeline-edit:${user.id}`, 120, 3600);
    const data = record(await readJson(request));
    return json(await movePipeline(textField(data.id, "Talep", 64, true), data, user));
  });
}
