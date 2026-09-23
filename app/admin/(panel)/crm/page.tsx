import { requireAdminPage } from "@/lib/crm/http";
import { listContacts } from "@/lib/crm/contacts.server";
import { ContactDirectory } from "@/components/admin/ContactDirectory";
export default async function CrmPage() {
  await requireAdminPage();
  return <ContactDirectory initial={await listContacts(new URLSearchParams())} />;
}
