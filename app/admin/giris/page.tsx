import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/crm/http";
import { hasAdminUsers } from "@/lib/crm/auth";
import { LoginForm } from "@/components/admin/LoginForm";
export const dynamic = "force-dynamic";
export default async function LoginPage() {
    if (await currentAdmin())
        redirect("/admin");
    let available = false;
    try {
        available = await hasAdminUsers();
    }
    catch { /* Setup state is shown without exposing server details. */ }
    return <LoginForm available={available}/>;
}
