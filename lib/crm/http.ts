import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { consumeLimit, findSession, SESSION_COOKIE, SESSION_TTL } from "./auth.ts";
import { CrmError } from "./validation.ts";
import type { AdminUser } from "./types.ts";
export function json(data: unknown, status = 200) {
    return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow" } });
}
export async function api(action: () => Promise<Response>) {
    try {
        return await action();
    }
    catch (error) {
        if (error instanceof CrmError)
            return json({ error: error.message }, error.status);
        console.error("CRM request failed:", error instanceof Error ? error.name : "UnknownError");
        return json({ error: "İşlem şu anda tamamlanamadı. Lütfen biraz sonra tekrar deneyin." }, 503);
    }
}
export function verifyOrigin(request: Request) {
    const configured = process.env.APP_ORIGIN;
    const allowed = [configured, process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`, process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`].filter(Boolean).map(value => new URL(value!).origin);
    if (!allowed.length && process.env.NODE_ENV === "production")
        throw new CrmError("Talep sistemi henüz yapılandırılmadı. Lütfen telefonla ulaşın.", 503);
    if (!allowed.length) allowed.push(new URL(request.url).origin);
    if (!allowed.includes(request.headers.get("origin") || "") || request.headers.get("sec-fetch-site") === "cross-site")
        throw new CrmError("İstek kaynağı doğrulanamadı. Sayfayı yenileyin.", 403);
}
export async function readJson(request: Request) {
    if (!/^application\/json(?:;|$)/i.test(request.headers.get("content-type") || ""))
        throw new CrmError("JSON istek bekleniyor.", 415);
    if (Number(request.headers.get("content-length") || 0) > 16384)
        throw new CrmError("İstek çok büyük.", 413);
    const reader = request.body?.getReader();
    if (!reader)
        throw new CrmError("İstek boş.");
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
        const result = await reader.read();
        if (result.done)
            break;
        length += result.value.byteLength;
        if (length > 16384) {
            await reader.cancel();
            throw new CrmError("İstek çok büyük.", 413);
        }
        chunks.push(result.value);
    }
    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
    }
    catch {
        throw new CrmError("İstek okunamadı.");
    }
}
export async function currentAdmin() { return await findSession((await cookies()).get(SESSION_COOKIE)?.value); }
export async function requireAdmin(): Promise<AdminUser> {
    const user = await currentAdmin();
    if (!user)
        throw new CrmError("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.", 401);
    return user;
}
export async function requireAdminPage() {
    const user = await currentAdmin();
    if (!user)
        redirect("/admin/giris");
    return user;
}
export async function setSessionCookie(token: string) {
    (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL });
}
export async function clearSessionCookie() { (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 }); }
export async function limit(key: string, count: number, seconds: number) { if (!await consumeLimit(key, count, seconds))
    throw new CrmError("Çok fazla işlem yapıldı. Biraz bekleyip tekrar deneyin.", 429); }
export function clientBucket(request: Request) {
    // Enable only behind a proxy that overwrites this header.
    return process.env.VERCEL || process.env.CRM_TRUST_PROXY === "true" ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 100) || "unknown" : "shared";
}
