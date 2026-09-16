import { api, json, limit, readJson, requireAdmin, verifyOrigin } from "@/lib/crm/http";
import { deleteProject, getProject, parseProject, saveProject } from "@/lib/projects/repository";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  return api(async () => { await requireAdmin(); return json({ project: await getProject((await context.params).id) }); });
}
export async function PATCH(request: Request, context: Context) {
  return api(async () => {
    verifyOrigin(request); const user = await requireAdmin();
    await limit(`project-write:${user.id}`, 100, 900);
    return json({ project: await saveProject(parseProject(await readJson(request)), user.id, (await context.params).id) });
  });
}
export async function DELETE(request: Request, context: Context) {
  return api(async () => { verifyOrigin(request); await requireAdmin(); await deleteProject((await context.params).id); return json({ ok: true }); });
}
