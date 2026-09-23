import { api, json, limit, readJson, requireAdmin, verifyOrigin } from "@/lib/crm/http";
import { createContact, listContacts } from "@/lib/crm/contacts.server";
export async function GET(request: Request) {
  return api(async () => { const user = await requireAdmin(); await limit(`contacts-read:${user.id}`, 240, 60); return json(await listContacts(new URL(request.url).searchParams)); });
}
export async function POST(request: Request) {
  return api(async () => {
    const user = await requireAdmin(); verifyOrigin(request); await limit(`contacts-create:${user.id}`, 120, 3600);
    return json(await createContact(await readJson(request), request.headers.get("Idempotency-Key") || "", user.id), 201);
  });
}
