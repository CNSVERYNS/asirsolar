import { requireAdminPage } from "@/lib/crm/http";
import { listUsers } from "@/lib/crm/auth";
import { listLeads } from "@/lib/crm/repository";
import { emailConfigured } from "@/lib/crm/email";
import { Dashboard } from "@/components/admin/Dashboard";
export default async function DashboardPage() {
    await requireAdminPage();
    return <Dashboard initialData={await listLeads(new URLSearchParams())} users={await listUsers()} mailReady={emailConfigured()}/>;
}
