import { createHash, randomUUID } from "node:crypto";
import { getDatabase, transaction } from "./database.ts";
import { isValidEmail } from "../enquiry.ts";
import { CrmError, parseVersion, record, textField } from "./validation.ts";
import type { Contact, ContactDetail, ContactInput, ContactList } from "./contacts.ts";

const columns = "id,name,company,phone,email,address,version,created_at AS createdAt,updated_at AS updatedAt";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function clean(value: unknown, label: string, max: number, required = false, multiline = false) {
  const result = textField(value, label, max, required);
  if ((multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/).test(result)) throw new CrmError(`${label} geçersiz karakter içeriyor.`);
  return result;
}
export function parseContact(value: unknown): ContactInput {
  const data = record(value);
  const name = clean(data.name, "Ad soyad", 100, true);
  const phone = clean(data.phone, "Telefon", 25);
  const email = clean(data.email, "E-posta", 254).toLowerCase();
  if (name.length < 2) throw new CrmError("Ad soyad en az 2 karakter olmalı.");
  if (phone && (!/^[+\d\s().-]+$/.test(phone) || !/^\d{10,15}$/.test(phone.replace(/\D/g, "")))) throw new CrmError("Telefon numarası geçersiz.");
  if (email && !isValidEmail(email)) throw new CrmError("E-posta adresi geçersiz.");
  return { name, phone, email, company: clean(data.company, "Şirket", 150), address: clean(data.address, "Adres", 1000, false, true) };
}
export async function listContacts(params: URLSearchParams): Promise<ContactList> {
  const query = clean(params.get("q") || "", "Arama", 150);
  const sort = params.get("sort") === "company" ? "company" : "name";
  const requested = Math.min(1000000, Math.max(1, Math.floor(Number(params.get("page")) || 1)));
  const pageSize = 25;
  const escaped = query.replace(/[\\%_]/g, "\\$&");
  const digits = query.replace(/\D/g, "");
  const phoneSearch = /^[+\d\s().-]+$/.test(query) && digits.length >= 3;
  const where = query ? `WHERE (concat_ws(' ',name,company,phone,email,address) ILIKE ? ESCAPE '\\'${phoneSearch ? " OR regexp_replace(phone,'[^0-9]','','g') LIKE ?" : ""})` : "";
  const values = query ? [`%${escaped}%`, ...(phoneSearch ? [`%${digits}%`] : [])] : [];
  const db = getDatabase();
  const { total } = await db.prepare(`SELECT count(*) AS total FROM asir_crm.contacts ${where}`).get(...values) as { total: number };
  const page = Math.min(requested, Math.max(1, Math.ceil(total / pageSize)));
  const contacts = await db.prepare(`SELECT ${columns} FROM asir_crm.contacts ${where} ORDER BY ${sort === "company" ? "lower(company)," : ""}lower(name),id LIMIT ? OFFSET ?`).all(...values, pageSize, (page - 1) * pageSize) as Contact[];
  return { contacts, total, page, pageSize, query, sort };
}
async function contactById(id: string): Promise<Contact> {
  if (!uuid.test(id)) throw new CrmError("Kişi bulunamadı.", 404);
  const contact = await getDatabase().prepare(`SELECT ${columns} FROM asir_crm.contacts WHERE id=?`).get(id) as Contact | undefined;
  if (!contact) throw new CrmError("Kişi bulunamadı.", 404);
  return contact;
}
export async function getContact(id: string): Promise<ContactDetail> {
  const contact = await contactById(id);
  const db = getDatabase();
  const leads = await db.prepare("SELECT l.id,l.reference_number AS reference,l.project_type AS projectType,l.created_at AS createdAt FROM asir_crm.lead_contacts lc JOIN asir_crm.leads l ON l.id=lc.lead_id WHERE lc.contact_id=? ORDER BY l.created_at DESC,l.id LIMIT 50").all(id) as ContactDetail["leads"];
  const { total } = await db.prepare("SELECT count(*) AS total FROM asir_crm.lead_contacts WHERE contact_id=?").get(id) as { total: number };
  return { contact, leads, leadCount: total };
}
export async function createContact(value: unknown, requestKey: string, actorId: string): Promise<{ contact: Contact; duplicate: boolean }> {
  const input = parseContact(value);
  if (!uuid.test(requestKey)) throw new CrmError("İstek anahtarı geçersiz.");
  const key = `request:${requestKey.toLowerCase()}`;
  const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  return transaction(async db => {
    await db.prepare("SELECT pg_advisory_xact_lock(hashtextextended(?,0))").run(key);
    const existing = await db.prepare("SELECT contact_id AS contactId,payload_hash AS payloadHash FROM asir_crm.contact_keys WHERE identity_key=?").get(key) as { contactId: string; payloadHash: string } | undefined;
    if (existing) {
      if (existing.payloadHash !== hash) throw new CrmError("Bu istek anahtarı farklı bir kayıt için kullanılmış.", 409);
      return { contact: await contactById(existing.contactId), duplicate: true };
    }
    const candidate = randomUUID();
    const { id } = await db.prepare("SELECT asir_crm.ensure_contact(?,?,?,?,?,?,?,?) AS id").get(candidate, input.name, input.phone, input.email, input.company, input.address, new Date().toISOString(), actorId) as { id: string };
    await db.prepare("INSERT INTO asir_crm.contact_keys(identity_key,contact_id,payload_hash) VALUES(?,?,?)").run(key, id, hash);
    return { contact: await contactById(id), duplicate: id !== candidate };
  });
}
export async function updateContact(id: string, value: unknown, actorId: string): Promise<Contact> {
  const data = record(value), input = parseContact(data), version = parseVersion(data.version);
  return transaction(async db => {
    await contactById(id);
    const { key } = await db.prepare("SELECT asir_crm.contact_identity(?,?,?,?) AS key").get(input.name, input.phone, input.email, id) as { key: string };
    // Identity lock precedes row lock, matching create/import lock order.
    await db.prepare("SELECT pg_advisory_xact_lock(hashtextextended(?,0))").run(key);
    const existing = await db.prepare("SELECT contact_id AS contactId FROM asir_crm.contact_keys WHERE identity_key=?").get(key) as { contactId: string } | undefined;
    if (existing && existing.contactId !== id) throw new CrmError("Bu ad ve iletişim bilgisiyle başka bir kişi zaten kayıtlı.", 409);
    const updated = await db.prepare(`UPDATE asir_crm.contacts SET name=?,company=?,phone=?,email=?,address=?,version=version+1,updated_by=?,updated_at=? WHERE id=? AND version=? RETURNING ${columns}`).get(input.name, input.company, input.phone, input.email, input.address, actorId, new Date().toISOString(), id, version) as Contact | undefined;
    if (!updated) throw new CrmError("Bu kişi başka bir işlemde güncellendi. Pencereyi kapatıp yeniden açın.", 409);
    await db.prepare("INSERT INTO asir_crm.contact_keys(identity_key,contact_id) VALUES(?,?) ON CONFLICT DO NOTHING").run(key, id);
    return updated;
  });
}
