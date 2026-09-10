BEGIN;
SELECT pg_advisory_xact_lock(864209001);
-- A dedicated application role can own this schema without CREATE on the database.
-- PostgreSQL checks that privilege even for CREATE SCHEMA IF NOT EXISTS.
DO $$ BEGIN
  IF to_regnamespace('asir_crm') IS NULL THEN
    CREATE SCHEMA asir_crm;
  END IF;
END $$;
REVOKE ALL ON SCHEMA asir_crm FROM PUBLIC;
CREATE TABLE IF NOT EXISTS asir_crm.users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE CHECK(email = lower(email)),
  name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS asir_crm.sessions (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES asir_crm.users(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON asir_crm.sessions(expires_at);
CREATE TABLE IF NOT EXISTS asir_crm.leads (
  id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', company TEXT NOT NULL DEFAULT '',
  project_type TEXT NOT NULL, message TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL CHECK(source IN ('website','whatsapp','phone','email','referral','other')),
  stage TEXT NOT NULL DEFAULT 'new' CHECK(stage IN ('new','meeting','proposal','won','lost','in_progress','completed')),
  assignee_id TEXT REFERENCES asir_crm.users(id), priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('normal','high')),
  next_follow_up TEXT, quote_cents BIGINT CHECK(quote_cents IS NULL OR quote_cents BETWEEN 0 AND 999999999999), rejection_reason TEXT NOT NULL DEFAULT '',
  consent_at TEXT, consent_version TEXT, submission_key TEXT UNIQUE, payload_hash TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT, version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS leads_created ON asir_crm.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_stage ON asir_crm.leads(stage, archived_at);
CREATE INDEX IF NOT EXISTS leads_follow_up ON asir_crm.leads(next_follow_up, archived_at);
CREATE TABLE IF NOT EXISTS asir_crm.lead_events (
  id TEXT PRIMARY KEY, sequence BIGINT GENERATED ALWAYS AS IDENTITY,
  lead_id TEXT NOT NULL REFERENCES asir_crm.leads(id), actor_id TEXT REFERENCES asir_crm.users(id),
  kind TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_lead ON asir_crm.lead_events(lead_id, sequence DESC);
CREATE TABLE IF NOT EXISTS asir_crm.email_outbox (
  id TEXT PRIMARY KEY, sequence BIGINT GENERATED ALWAYS AS IDENTITY,
  lead_id TEXT NOT NULL REFERENCES asir_crm.leads(id), recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed')),
  attempts INTEGER NOT NULL DEFAULT 0, sent_at TEXT, error_code TEXT, available_at BIGINT NOT NULL DEFAULT 0,
  claimed_at BIGINT, claim_token TEXT, UNIQUE(lead_id, recipient)
);
CREATE INDEX IF NOT EXISTS outbox_pending ON asir_crm.email_outbox(status, available_at);
CREATE TABLE IF NOT EXISTS asir_crm.request_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at BIGINT NOT NULL);

-- Private server-only schema. Never add it to Supabase's exposed API schemas.
ALTER TABLE asir_crm.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE asir_crm.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asir_crm.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE asir_crm.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE asir_crm.email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE asir_crm.request_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA asir_crm FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA asir_crm FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA asir_crm FROM anon;
    REVOKE ALL ON ALL TABLES IN SCHEMA asir_crm FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA asir_crm FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA asir_crm FROM authenticated;
  END IF;
END $$;
COMMIT;
