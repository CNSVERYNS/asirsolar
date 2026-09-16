BEGIN;
SELECT pg_advisory_xact_lock(864209003);
ALTER TABLE asir_crm.users ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_username ON asir_crm.users(lower(username));
UPDATE asir_crm.users SET username = 'onurdurak' WHERE id = 'onur' AND username IS NULL;
CREATE TABLE IF NOT EXISTS asir_crm.projects (
  id TEXT PRIMARY KEY, name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 160),
  description TEXT NOT NULL CHECK(length(description) BETWEEN 1 AND 5000),
  start_date TEXT NOT NULL, end_date TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT NOT NULL REFERENCES asir_crm.users(id),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  CHECK(end_date IS NULL OR end_date >= start_date)
);
CREATE TABLE IF NOT EXISTS asir_crm.project_images (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES asir_crm.projects(id) ON DELETE CASCADE,
  data BYTEA NOT NULL CHECK(octet_length(data) <= 3145728),
  position INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS project_images_project ON asir_crm.project_images(project_id, position);
ALTER TABLE asir_crm.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE asir_crm.project_images ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON asir_crm.projects, asir_crm.project_images FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON asir_crm.projects, asir_crm.project_images FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON asir_crm.projects, asir_crm.project_images FROM authenticated;
  END IF;
END $$;
COMMIT;
