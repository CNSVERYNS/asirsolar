import { cookies } from "next/headers";
import { revokeSession, SESSION_COOKIE } from "@/lib/crm/auth";
import { api, clearSessionCookie, json, verifyOrigin } from "@/lib/crm/http";
export async function POST(request: Request) {
    return api(async () => { verifyOrigin(request); await revokeSession((await cookies()).get(SESSION_COOKIE)?.value); await clearSessionCookie(); return json({ ok: true }); });
}
