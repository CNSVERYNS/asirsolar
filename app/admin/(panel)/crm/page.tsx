import { requireAdminPage } from "@/lib/crm/http";
import { listPipeline } from "@/lib/crm/pipeline.server";
import { PipelineBoard } from "@/components/admin/PipelineBoard";
export default async function CrmPage() {
  await requireAdminPage();
  return <PipelineBoard initial={await listPipeline(new URLSearchParams())} />;
}
