import { api, json, limit, readJson, requireAdmin, verifyOrigin } from "@/lib/crm/http";
import { getContact, updateContact } from "@/lib/crm/contacts.server";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  return api(async () => {
    const user = await requireAdmin(); await limit(`contacts-read:${user.id}`, 240, 60);
    return json(await getContact((await params).id));
  });
}
export async function PATCH(request: Request, { params }: Context) {
  return api(async () => {
    const user = await requireAdmin(); verifyOrigin(request); await limit(`contacts-edit:${user.id}`, 120, 3600);
    return json({ contact: await updateContact((await params).id, await readJson(request), user.id) });
  });
}
