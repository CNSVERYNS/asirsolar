import "server-only";
import { cache } from "react";
import { getDatabase } from "../crm/database";
import type { ManagedProject } from "./types";
export const getPublishedProject = cache(async (slugOrId: string): Promise<ManagedProject | undefined> => {
  if (slugOrId.length > 48 || !/^[a-z0-9]+(-[a-z0-9]+)*$/i.test(slugOrId)) return undefined;
  const legacyId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  return await getDatabase().prepare(`SELECT p.id,p.slug,p.name,p.description,p.start_date AS startDate,p.end_date AS endDate,p.published,p.created_at AS createdAt,p.updated_at AS updatedAt,
    COALESCE((SELECT json_agg(json_build_object('id',i.id,'url','/api/projeler/gorseller/'||i.id) ORDER BY i.position,i.id) FROM project_images i WHERE i.project_id=p.id),'[]'::json) AS images
    FROM projects p WHERE p.${legacyId ? "id" : "slug"}=? AND p.published=true`).get(slugOrId) as ManagedProject | undefined;
});
