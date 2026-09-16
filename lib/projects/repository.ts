import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { getDatabase, transaction } from "../crm/database.ts";
import { CrmError, record, textField } from "../crm/validation.ts";
import { MAX_IMAGE_BYTES, MAX_PROJECT_IMAGES, type ManagedProject, type ProjectInput } from "./types.ts";

function date(value: unknown, label: string, required = false) {
  const result = textField(value, label, 10, required);
  if (!result) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(Date.parse(result)) || new Date(result).toISOString().slice(0, 10) !== result) throw new CrmError(`${label} geçersiz.`);
  return result;
}
export function parseProject(value: unknown): ProjectInput {
  const data = record(value);
  const startDate = date(data.startDate, "Başlangıç tarihi", true)!;
  const endDate = date(data.endDate, "Bitiş tarihi");
  if (endDate && endDate < startDate) throw new CrmError("Bitiş tarihi başlangıç tarihinden önce olamaz.");
  if (typeof data.published !== "boolean") throw new CrmError("Yayın durumu geçersiz.");
  return { name: textField(data.name, "Proje ismi", 160, true), description: textField(data.description, "Açıklama", 5000, true), startDate, endDate, published: data.published };
}
const columns = `p.id, p.name, p.description, p.start_date AS startDate, p.end_date AS endDate,
  p.published, p.created_at AS createdAt, p.updated_at AS updatedAt,
  COALESCE((SELECT json_agg(json_build_object('id', i.id, 'url', '/api/projeler/gorseller/' || i.id) ORDER BY i.position, i.id)
    FROM project_images i WHERE i.project_id = p.id), '[]'::json) AS images`;
export async function listProjects(publicOnly = true): Promise<ManagedProject[]> {
  return await getDatabase().prepare(`SELECT ${columns} FROM projects p ${publicOnly ? "WHERE p.published = true" : ""} ORDER BY p.created_at DESC, p.id`).all() as ManagedProject[];
}
export async function getProject(id: string): Promise<ManagedProject> {
  const result = await getDatabase().prepare(`SELECT ${columns} FROM projects p WHERE p.id = ?`).get(id) as ManagedProject | undefined;
  if (!result) throw new CrmError("Proje bulunamadı.", 404);
  return result;
}
export async function saveProject(input: ProjectInput, userId: string, id?: string) {
  const db = getDatabase();
  const now = new Date().toISOString();
  if (id) {
    const updated = await db.prepare("UPDATE projects SET name=?, description=?, start_date=?, end_date=?, published=?, updated_at=? WHERE id=? RETURNING id").get(input.name, input.description, input.startDate, input.endDate, input.published, now, id);
    if (!updated) throw new CrmError("Proje bulunamadı.", 404);
  } else {
    id = randomUUID();
    await db.prepare("INSERT INTO projects (id, name, description, start_date, end_date, published, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, input.name, input.description, input.startDate, input.endDate, input.published, userId, now, now);
  }
  return getProject(id);
}
export async function deleteProject(id: string) {
  if (!await getDatabase().prepare("DELETE FROM projects WHERE id=? RETURNING id").get(id)) throw new CrmError("Proje bulunamadı.", 404);
}
export async function addProjectImage(projectId: string, bytes: Buffer) {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new CrmError("Her görsel en fazla 3 MB olabilir.", 413);
  let normalized: Buffer;
  try {
    const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format || "") || (metadata.pages ?? 1) > 1) throw new Error("format");
    normalized = await image.rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch { throw new CrmError("Geçerli bir JPG, PNG veya WebP görseli seçin."); }
  if (normalized.length > MAX_IMAGE_BYTES) throw new CrmError("Görsel çok büyük. Daha küçük bir görsel seçin.", 413);
  return transaction(async db => {
    if (!await db.prepare("SELECT id FROM projects WHERE id=? FOR UPDATE").get(projectId)) throw new CrmError("Proje bulunamadı.", 404);
    const counts = await db.prepare("SELECT count(*)::integer AS total, COALESCE(max(position), -1)::integer AS last FROM project_images WHERE project_id=?").get(projectId) as { total: number; last: number };
    if (counts.total >= MAX_PROJECT_IMAGES) throw new CrmError("Bir projeye en fazla 12 görsel eklenebilir.");
    const id = randomUUID();
    await db.prepare("INSERT INTO project_images (id, project_id, data, position, created_at) VALUES (?, ?, ?, ?, ?)").run(id, projectId, normalized, counts.last + 1, new Date().toISOString());
    return { id, url: `/api/projeler/gorseller/${id}` };
  });
}
export async function removeProjectImage(projectId: string, id: string) {
  if (!await getDatabase().prepare("DELETE FROM project_images WHERE id=? AND project_id=? RETURNING id").get(id, projectId)) throw new CrmError("Görsel bulunamadı.", 404);
}
export async function getProjectImage(id: string, includeDrafts = false) {
  return await getDatabase().prepare(`SELECT i.data FROM project_images i JOIN projects p ON p.id=i.project_id WHERE i.id=? ${includeDrafts ? "" : "AND p.published=true"}`).get(id) as { data: Uint8Array } | undefined;
}
export async function projectImageVisibility(id: string) {
  return await getDatabase().prepare("SELECT p.published FROM project_images i JOIN projects p ON p.id=i.project_id WHERE i.id=?").get(id) as { published: boolean } | undefined;
}
