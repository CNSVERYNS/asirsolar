import { after } from "next/server";
import { api, json, limit, readJson, requireAdmin, verifyOrigin } from "@/lib/crm/http";
import { addLeadNote, archiveLead, getLead, updateLead } from "@/lib/crm/repository";
import { CrmError, parseLeadInput, parseVersion, record, textField } from "@/lib/crm/validation";
import { emailConfigured, flushEmailOutbox } from "@/lib/crm/email";
type Context = {
    params: Promise<{
        id: string;
    }>;
};
export async function GET(_request: Request, context: Context) { return api(async () => { await requireAdmin(); return json(await getLead((await context.params).id)); }); }
export async function PATCH(request: Request, context: Context) {
    return api(async () => {
        verifyOrigin(request);
        const user = await requireAdmin();
        await limit(`edit:${user.id}`, 180, 3600);
        const { id } = await context.params;
        const data = record(await readJson(request));
        if (data.action === "note")
            return json(await addLeadNote(id, textField(data.note, "Görüşme notu", 3000, true), user));
        if (data.action === "archive") {
            if (typeof data.archived !== "boolean")
                throw new CrmError("Arşiv işlemi geçersiz.");
            return json(await archiveLead(id, data.archived, parseVersion(data.version), user));
        }
        if (data.action === "retry-email") {
            await getLead(id);
            if (!emailConfigured())
                throw new CrmError("E-posta bağlantısı henüz yapılandırılmadı.", 503);
            await limit(`retry:${id}`, 3, 300);
            after(async () => { try {
                await flushEmailOutbox(id, true);
            }
            catch {
                console.error("CRM notification retry failed.");
            } });
            return json({ ok: true });
        }
        if (data.action !== "update")
            throw new CrmError("İşlem tanınmadı.");
        return json(await updateLead(id, parseLeadInput(data), parseVersion(data.version), user));
    });
}

export const maxDuration = 60;
