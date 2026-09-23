BEGIN;
SET LOCAL lock_timeout = '5s';
SELECT pg_advisory_xact_lock(864209008);
LOCK TABLE asir_crm.projects IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE asir_crm.projects ADD COLUMN IF NOT EXISTS slug TEXT;

-- Assign once: renaming a project must not break its published URL.
-- The trigger also supports older application versions during a rolling deploy.
CREATE OR REPLACE FUNCTION asir_crm.assign_project_slug() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, asir_crm AS $$
DECLARE base_slug TEXT; candidate TEXT; suffix INTEGER := 1;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.slug IS NOT NULL THEN
    NEW.slug := OLD.slug;
    RETURN NEW;
  END IF;
  PERFORM pg_advisory_xact_lock(864209009);
  base_slug := trim(both '-' from regexp_replace(lower(translate(NEW.name,
    'ÇĞİÖŞÜçğıöşü', 'CGIOSUcgiosu')), '[^a-z0-9]+', '-', 'g'));
  base_slug := rtrim(left(base_slug, 32), '-');
  IF base_slug = '' THEN base_slug := 'proje'; END IF;
  candidate := base_slug;
  WHILE EXISTS (SELECT 1 FROM asir_crm.projects WHERE slug = candidate AND id <> NEW.id) LOOP
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix::text;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS assign_project_slug ON asir_crm.projects;
CREATE TRIGGER assign_project_slug BEFORE INSERT OR UPDATE OF slug ON asir_crm.projects
FOR EACH ROW EXECUTE FUNCTION asir_crm.assign_project_slug();

-- Deterministic backfill; no project content, dates, IDs or image data change.
DO $$ DECLARE project_id TEXT; BEGIN
  FOR project_id IN SELECT id FROM asir_crm.projects WHERE slug IS NULL ORDER BY created_at, id LOOP
    UPDATE asir_crm.projects SET slug = NULL WHERE id = project_id;
  END LOOP;
END $$;
ALTER TABLE asir_crm.projects ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug ON asir_crm.projects(slug);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'asir_crm.projects'::regclass AND conname = 'project_slug_format') THEN
    ALTER TABLE asir_crm.projects ADD CONSTRAINT project_slug_format
      CHECK (length(slug) BETWEEN 1 AND 48 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  END IF;
END $$;
COMMIT;
