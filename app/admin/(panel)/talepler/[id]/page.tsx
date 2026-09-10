import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/crm/http";
import { listUsers } from "@/lib/crm/auth";
import { getLead } from "@/lib/crm/repository";
import { CrmError } from "@/lib/crm/validation";
import { LeadWorkspace } from "@/components/admin/LeadWorkspace";
export default async function LeadPage({ params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    await requireAdminPage();
    const { id } = await params;
    let detail;
    try {
        detail = await getLead(id);
    }
    catch (error) {
        if (error instanceof CrmError && error.status === 404)
            notFound();
        throw error;
    }
    return <LeadWorkspace initialDetail={detail} users={await listUsers()}/>;
}
