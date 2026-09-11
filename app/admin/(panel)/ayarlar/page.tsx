import { requireAdminPage } from "@/lib/crm/http";
import { emailEnabled } from "@/lib/crm/notifications.server";
import { AccountSettings } from "@/components/admin/AccountSettings";
import { NotificationHealth } from "@/components/admin/NotificationHealth";
export default async function SettingsPage() { const user = await requireAdminPage(); return <><AccountSettings user={user} mailReady={emailEnabled()}/><NotificationHealth /></>; }
