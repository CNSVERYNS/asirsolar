import { authenticate, createSession } from "@/lib/crm/auth";
import { api, clientBucket, json, limit, readJson, setSessionCookie, verifyOrigin } from "@/lib/crm/http";
import { CrmError, record, textField } from "@/lib/crm/validation";
export async function POST(request: Request) {
    return api(async () => {
        verifyOrigin(request);
        await limit(`login:${clientBucket(request)}`, 30, 900);
        const data = record(await readJson(request));
        const email = textField(data.email, "E-posta", 254, true).toLowerCase();
        if (typeof data.password !== "string" || !data.password.length || data.password.length > 128)
            throw new CrmError("E-posta veya parola hatalı.", 401);
        await limit(`login-account:${email}`, 8, 900);
        const user = await authenticate(email, data.password);
        if (!user)
            throw new CrmError("E-posta veya parola hatalı.", 401);
        await setSessionCookie(await createSession(user.id));
        return json({ user });
    });
}
