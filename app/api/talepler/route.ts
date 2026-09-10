import { after } from "next/server";
import { api, clientBucket, json, limit, readJson, verifyOrigin } from "@/lib/crm/http";
import { createWebsiteLead } from "@/lib/crm/repository";
import { CrmError, parsePublicEnquiry } from "@/lib/crm/validation";
import { flushEmailOutbox } from "@/lib/crm/email";
export const runtime = "nodejs";
export async function POST(request: Request) {
    return api(async () => {
        verifyOrigin(request);
        await limit(`public:${clientBucket(request)}`, 30, 3600);
        const key = request.headers.get("idempotency-key");
        if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key))
            throw new CrmError("Gönderim anahtarı eksik. Sayfayı yenileyin.");
        const enquiry = parsePublicEnquiry(await readJson(request));
        await limit(`enquiry:${enquiry.email}`, 8, 3600);
        const result = await createWebsiteLead(enquiry, key);
        after(async () => { try {
            await flushEmailOutbox(result.id);
        }
        catch {
            console.error("CRM notification remains queued.");
        } });
        return json({ reference: result.reference, message: "Talebiniz ekibimize ulaştı." }, result.duplicate ? 200 : 201);
    });
}

export const maxDuration = 60;
