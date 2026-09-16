import { requireAdminPage } from "@/lib/crm/http";
import { listProjects } from "@/lib/projects/repository";
import { ProjectWorkspace } from "@/components/admin/ProjectWorkspace";
export default async function ProjectsAdminPage() {
  await requireAdminPage();
  return <ProjectWorkspace initialProjects={await listProjects(false)} />;
}
