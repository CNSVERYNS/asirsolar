import { changePassword } from "@/lib/crm/auth";
import { api, json, limit, readJson, requireAdmin, setSessionCookie, verifyOrigin } from "@/lib/crm/http";
import { CrmError, record } from "@/lib/crm/validation";
export async function POST(request: Request) {
    return api(async () => {
        verifyOrigin(request);
        const user = await requireAdmin();
        await limit(`password:${user.id}`, 5, 900);
        const data = record(await readJson(request));
        if (typeof data.currentPassword !== "string" || typeof data.newPassword !== "string" || data.currentPassword.length > 128)
            throw new CrmError("Parola geçersiz.");
        await setSessionCookie(await changePassword(user, data.currentPassword, data.newPassword));
        return json({ ok: true });
    });
}
