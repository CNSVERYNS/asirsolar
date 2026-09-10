import { requireAdminPage } from "@/lib/crm/http";
import { emailConfigured } from "@/lib/crm/email";
import { AccountSettings } from "@/components/admin/AccountSettings";
export default async function SettingsPage() { const user = await requireAdminPage(); return <AccountSettings user={user} mailReady={emailConfigured()}/>; }
