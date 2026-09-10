import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { getDatabase, transaction } from "./database.ts";
import type { AdminUser } from "./types.ts";
import { CrmError } from "./validation.ts";
export const SESSION_COOKIE = "asir_admin_session";
export const SESSION_TTL = 60 * 60 * 12;
export const adminAccounts = [
    { id: "onur", name: "Onur Durak", email: "onur.durak@asirsolar.com" },
    { id: "furkan", name: "Furkan Cansever", email: "furkan.cansever@asirsolar.com" },
] as const;
const dummyHash = `scrypt$32768$8$3$${"00".repeat(16)}$${"00".repeat(64)}`;
function derive(password: string, salt: Buffer) {
    return new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)));
}
export function passwordValid(password: unknown): password is string { return typeof password === "string" && password.length >= 12 && password.length <= 128; }
export async function hashPassword(password: string) {
    if (!passwordValid(password))
        throw new CrmError("Parola 12–128 karakter arasında olmalı.");
    const salt = randomBytes(16);
    const key = await derive(password, salt);
    return `scrypt$32768$8$3$${salt.toString("hex")}$${key.toString("hex")}`;
}
export async function verifyPassword(password: string, stored = dummyHash) {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts.slice(0, 4).join("$") !== "scrypt$32768$8$3" || !/^[a-f0-9]{32}$/.test(parts[4]) || !/^[a-f0-9]{128}$/.test(parts[5]))
        return false;
    const actual = await derive(password, Buffer.from(parts[4], "hex"));
    return timingSafeEqual(actual, Buffer.from(parts[5], "hex"));
}
export function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
export async function listUsers(): Promise<AdminUser[]> { return await getDatabase().prepare("SELECT id, name, email FROM users ORDER BY name").all() as AdminUser[]; }
export async function hasAdminUsers() { return Boolean(await getDatabase().prepare("SELECT id FROM users LIMIT 1").get()); }
export async function provisionAdmin(email: string, password: string, reset = false) {
    const account = adminAccounts.find((item) => item.email === email.toLowerCase());
    if (!account)
        throw new CrmError("Yalnızca tanımlı şirket hesapları oluşturulabilir.");
    const hash = await hashPassword(password);
    await transaction(async (db) => {
        const existing = await db.prepare("SELECT id FROM users WHERE email = ?").get(account.email);
        if (existing && !reset)
            throw new CrmError("Bu hesap zaten var. Parola sıfırlamak için açıkça --reset kullanın.", 409);
        if (existing) {
            await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, account.id);
            await db.prepare("DELETE FROM sessions WHERE user_id = ?").run(account.id);
        }
        else
            await db.prepare("INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)").run(account.id, account.name, account.email, hash, new Date().toISOString());
    });
    return account;
}
let activeChecks = 0;
export async function authenticate(email: string, password: string): Promise<AdminUser | null> {
    if (activeChecks >= 2)
        throw new CrmError("Biraz bekleyip tekrar deneyin.", 429);
    activeChecks++;
    try {
        const user = await getDatabase().prepare("SELECT id, name, email, password_hash FROM users WHERE email = lower(?)").get(email) as (AdminUser & {
            password_hash: string;
        }) | undefined;
        const valid = await verifyPassword(password, user?.password_hash);
        if (!user || !valid)
            return null;
        return { id: user.id, name: user.name, email: user.email };
    }
    finally {
        activeChecks--;
    }
}
export async function createSession(userId: string) {
    const db = getDatabase();
    const token = randomBytes(32).toString("base64url");
    const now = Date.now();
    await db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
    await db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(tokenHash(token), userId, now + SESSION_TTL * 1000, new Date(now).toISOString());
    return token;
}
export async function findSession(token: string | undefined): Promise<AdminUser | null> {
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token))
        return null;
    return await getDatabase().prepare("SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?").get(tokenHash(token), Date.now()) as AdminUser | undefined ?? null;
}
export async function revokeSession(token: string | undefined) { if (token)
    await getDatabase().prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash(token)); }
export async function changePassword(user: AdminUser, oldPassword: string, newPassword: string) {
    if (!await authenticate(user.email, oldPassword))
        throw new CrmError("Mevcut parolanız doğru değil.");
    const hash = await hashPassword(newPassword);
    await transaction(async (db) => { await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, user.id); await db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id); });
    return await createSession(user.id);
}
export async function consumeLimit(key: string, limit: number, windowSeconds: number) {
    const now = Date.now();
    return await transaction(async (db) => {
        await db.prepare("DELETE FROM request_limits WHERE expires_at <= ?").run(now);
        const result = await db.prepare("INSERT INTO request_limits (key, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = request_limits.count + 1 RETURNING count").get(tokenHash(key), now + windowSeconds * 1000) as {
            count: number;
        };
        return result.count <= limit;
    });
}
