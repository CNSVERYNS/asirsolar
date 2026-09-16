import { listProjects } from "@/lib/projects/repository";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json({ projects: await listProjects() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "Projeler şu anda yüklenemiyor." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
