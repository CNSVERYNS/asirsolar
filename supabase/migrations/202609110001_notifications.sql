BEGIN;
SELECT pg_advisory_xact_lock(864209001);
CREATE TABLE IF NOT EXISTS asir_crm.schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE asir_crm.email_outbox DROP CONSTRAINT IF EXISTS email_outbox_status_check;
ALTER TABLE asir_crm.email_outbox ADD CONSTRAINT email_outbox_status_check CHECK(status IN ('held','pending','sending','sent','failed','unknown','cancelled'));
ALTER TABLE asir_crm.email_outbox ADD COLUMN IF NOT EXISTS retryable BOOLEAN NOT NULL DEFAULT true;
CREATE TABLE IF NOT EXISTS asir_crm.sms_outbox (
  id TEXT PRIMARY KEY, sequence BIGINT GENERATED ALWAYS AS IDENTITY,
  lead_id TEXT NOT NULL REFERENCES asir_crm.leads(id), recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK(status IN ('held','pending','sending','accepted','delivered','failed','unknown','cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0, sent_at TEXT, delivered_at TEXT, error_code TEXT,
  available_at BIGINT NOT NULL DEFAULT 0, claimed_at BIGINT, claim_token TEXT,
  retryable BOOLEAN NOT NULL DEFAULT true, provider_id TEXT, report_checked_at BIGINT NOT NULL DEFAULT 0,
  UNIQUE(lead_id, recipient)
);
CREATE INDEX IF NOT EXISTS sms_outbox_pending ON asir_crm.sms_outbox(status, available_at);
CREATE INDEX IF NOT EXISTS sms_outbox_reports ON asir_crm.sms_outbox(status, report_checked_at);
CREATE TABLE IF NOT EXISTS asir_crm.notification_worker (
  id TEXT PRIMARY KEY CHECK(id = 'worker'), last_started_at BIGINT NOT NULL, last_finished_at BIGINT,
  last_error TEXT
);
-- One-time hold for old unsent mail. Enabling a provider must never release a backlog.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM asir_crm.schema_migrations WHERE name='202609110001_notifications') THEN
    UPDATE asir_crm.email_outbox SET status='held', error_code='activation_review', claim_token=NULL
      WHERE status IN ('pending','failed');
    UPDATE asir_crm.email_outbox SET status='unknown', error_code='activation_review', retryable=false, claim_token=NULL
      WHERE status='sending';
    INSERT INTO asir_crm.schema_migrations(name) VALUES ('202609110001_notifications');
  END IF;
END $$;
ALTER TABLE asir_crm.sms_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE asir_crm.schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asir_crm.notification_worker ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA asir_crm FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA asir_crm FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA asir_crm FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA asir_crm FROM authenticated;
  END IF;
END $$;
COMMIT;
