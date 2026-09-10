import type { ReactNode } from "react";
import { requireAdminPage } from "@/lib/crm/http";
import { AdminShell } from "@/components/admin/AdminShell";
export const dynamic = "force-dynamic";
export default async function PanelLayout({ children }: {
    children: ReactNode;
}) {
    const user = await requireAdminPage();
    return <AdminShell user={user}>{children}</AdminShell>;
}
