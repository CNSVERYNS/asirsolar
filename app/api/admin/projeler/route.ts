import { api, json, limit, readJson, requireAdmin, verifyOrigin } from "@/lib/crm/http";
import { listProjects, parseProject, saveProject } from "@/lib/projects/repository";
export async function GET() {
  return api(async () => { await requireAdmin(); return json({ projects: await listProjects(false) }); });
}
export async function POST(request: Request) {
  return api(async () => {
    verifyOrigin(request); const user = await requireAdmin();
    await limit(`project-write:${user.id}`, 100, 900);
    return json({ project: await saveProject(parseProject(await readJson(request)), user.id) }, 201);
  });
}
