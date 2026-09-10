import { after } from "next/server";
import { flushEmailOutbox } from "@/lib/crm/email";
import { api, json, limit, readJson, requireAdmin, verifyOrigin } from "@/lib/crm/http";
import { createManualLead, listLeads } from "@/lib/crm/repository";
import { parseLeadInput } from "@/lib/crm/validation";
export async function GET(request: Request) { return api(async () => { await requireAdmin(); after(async () => { try { await flushEmailOutbox(); } catch { console.error("CRM notification remains queued."); } }); return json(await listLeads(new URL(request.url).searchParams)); }); }
export async function POST(request: Request) {
    return api(async () => { verifyOrigin(request); const user = await requireAdmin(); await limit(`manual:${user.id}`, 60, 3600); return json(await createManualLead(parseLeadInput(await readJson(request)), user), 201); });
}

export const maxDuration = 60;
