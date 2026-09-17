BEGIN;
SELECT pg_advisory_xact_lock(864209001);
SET LOCAL lock_timeout = '5s';

CREATE SEQUENCE IF NOT EXISTS asir_crm.quote_number_seq MAXVALUE 999999999999;
CREATE TABLE IF NOT EXISTS asir_crm.quote_threads (
  id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES asir_crm.leads(id),
  quote_number TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL,
  UNIQUE(id, lead_id)
);
CREATE TABLE IF NOT EXISTS asir_crm.quotes (
  id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, lead_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK(version > 0), edit_version INTEGER NOT NULL DEFAULT 1,
  customer_name TEXT NOT NULL, customer_email TEXT NOT NULL, customer_phone TEXT NOT NULL, project_type TEXT NOT NULL,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 180), message TEXT NOT NULL CHECK(length(message) BETWEEN 1 AND 6000),
  amount_cents BIGINT NOT NULL CHECK(amount_cents BETWEEN 1 AND 999999999999),
  currency TEXT NOT NULL CHECK(currency IN ('TRY','USD','EUR')),
  vat_mode TEXT NOT NULL CHECK(vat_mode IN ('included','excluded')), valid_until DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','viewed','accepted','revision_requested','rejected','expired','revoked')),
  email_requested BOOLEAN NOT NULL DEFAULT true, sms_requested BOOLEAN NOT NULL DEFAULT false,
  sent_at TEXT, first_viewed_at TEXT, last_viewed_at TEXT, accepted_at TEXT, revision_requested_at TEXT,
  rejected_at TEXT, expired_at TEXT, revoked_at TEXT, revision_message TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES asir_crm.users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  creation_key TEXT NOT NULL UNIQUE, creation_hash TEXT NOT NULL,
  FOREIGN KEY(thread_id,lead_id) REFERENCES asir_crm.quote_threads(id,lead_id), UNIQUE(thread_id,version)
);
CREATE UNIQUE INDEX IF NOT EXISTS quotes_one_draft ON asir_crm.quotes(thread_id) WHERE status='draft';
CREATE INDEX IF NOT EXISTS quotes_lead ON asir_crm.quotes(lead_id,created_at DESC);
CREATE TABLE IF NOT EXISTS asir_crm.quote_attachments (
  id TEXT PRIMARY KEY, quote_id TEXT NOT NULL REFERENCES asir_crm.quotes(id),
  original_filename TEXT NOT NULL, mime_type TEXT NOT NULL CHECK(mime_type IN ('application/pdf','image/png','image/jpeg')),
  size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 1 AND 3145728),
  data BYTEA NOT NULL CHECK(octet_length(data) BETWEEN 1 AND 3145728), sha256 TEXT NOT NULL, created_at TEXT NOT NULL,
  CHECK(size_bytes=octet_length(data)), UNIQUE(quote_id,sha256)
);
CREATE TABLE IF NOT EXISTS asir_crm.quote_tokens (
  token_hash TEXT PRIMARY KEY CHECK(token_hash ~ '^[a-f0-9]{64}$'),
  quote_id TEXT NOT NULL REFERENCES asir_crm.quotes(id), created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS quote_tokens_quote ON asir_crm.quote_tokens(quote_id);
CREATE TABLE IF NOT EXISTS asir_crm.quote_dispatches (
  id TEXT PRIMARY KEY, quote_id TEXT NOT NULL REFERENCES asir_crm.quotes(id),
  request_key TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS quote_dispatches_quote ON asir_crm.quote_dispatches(quote_id);
CREATE TABLE IF NOT EXISTS asir_crm.quote_events (
  id TEXT PRIMARY KEY, sequence BIGINT GENERATED ALWAYS AS IDENTITY,
  quote_id TEXT NOT NULL REFERENCES asir_crm.quotes(id), actor_type TEXT NOT NULL CHECK(actor_type IN ('admin','customer','system')),
  actor_id TEXT REFERENCES asir_crm.users(id), kind TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS quote_events_quote ON asir_crm.quote_events(quote_id,sequence);

-- Keep the existing outboxes/worker and original lead-delivery uniqueness.
ALTER TABLE asir_crm.email_outbox ADD COLUMN IF NOT EXISTS quote_id TEXT REFERENCES asir_crm.quotes(id);
ALTER TABLE asir_crm.email_outbox ADD COLUMN IF NOT EXISTS dispatch_id TEXT;
-- A bearer URL is retained only while a delivery can still be attempted. Never select this in an admin/public DTO.
ALTER TABLE asir_crm.email_outbox ADD COLUMN IF NOT EXISTS quote_token TEXT;
ALTER TABLE asir_crm.email_outbox DROP CONSTRAINT IF EXISTS email_outbox_purpose_check;
ALTER TABLE asir_crm.email_outbox ADD CONSTRAINT email_outbox_purpose_check CHECK(purpose IN ('team','customer_receipt','quote_customer','quote_accepted','quote_revision'));
DROP INDEX IF EXISTS asir_crm.email_outbox_lead_recipient_purpose;
CREATE UNIQUE INDEX IF NOT EXISTS email_outbox_lead_recipient_purpose ON asir_crm.email_outbox(lead_id,recipient,purpose) WHERE quote_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS email_outbox_quote_dispatch ON asir_crm.email_outbox(quote_id,dispatch_id,recipient,purpose) WHERE quote_id IS NOT NULL;
ALTER TABLE asir_crm.sms_outbox ADD COLUMN IF NOT EXISTS quote_id TEXT REFERENCES asir_crm.quotes(id);
ALTER TABLE asir_crm.sms_outbox ADD COLUMN IF NOT EXISTS dispatch_id TEXT;
ALTER TABLE asir_crm.sms_outbox ADD COLUMN IF NOT EXISTS quote_token TEXT;
ALTER TABLE asir_crm.sms_outbox DROP CONSTRAINT IF EXISTS sms_outbox_lead_id_recipient_key;
CREATE UNIQUE INDEX IF NOT EXISTS sms_outbox_lead_recipient ON asir_crm.sms_outbox(lead_id,recipient) WHERE quote_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sms_outbox_quote_dispatch ON asir_crm.sms_outbox(quote_id,dispatch_id,recipient) WHERE quote_id IS NOT NULL;

CREATE OR REPLACE FUNCTION asir_crm.protect_quote_version() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF ROW(NEW.id,NEW.thread_id,NEW.lead_id,NEW.version,NEW.created_by,NEW.created_at,NEW.creation_key,NEW.creation_hash)
     IS DISTINCT FROM ROW(OLD.id,OLD.thread_id,OLD.lead_id,OLD.version,OLD.created_by,OLD.created_at,OLD.creation_key,OLD.creation_hash) THEN
    RAISE EXCEPTION 'quote_identity_immutable';
  END IF;
  IF OLD.status <> 'draft' AND (NEW.status='draft' OR
    ROW(NEW.customer_name,NEW.customer_email,NEW.customer_phone,NEW.project_type,NEW.title,NEW.message,NEW.amount_cents,NEW.currency,NEW.vat_mode,NEW.valid_until,NEW.email_requested,NEW.sms_requested)
    IS DISTINCT FROM ROW(OLD.customer_name,OLD.customer_email,OLD.customer_phone,OLD.project_type,OLD.title,OLD.message,OLD.amount_cents,OLD.currency,OLD.vat_mode,OLD.valid_until,OLD.email_requested,OLD.sms_requested)) THEN
    RAISE EXCEPTION 'sent_quote_immutable';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION asir_crm.protect_quote_file() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE parent_status TEXT;
BEGIN
  SELECT status INTO parent_status FROM asir_crm.quotes WHERE id=COALESCE(NEW.quote_id,OLD.quote_id) FOR UPDATE;
  IF parent_status IS DISTINCT FROM 'draft' THEN RAISE EXCEPTION 'sent_quote_file_immutable'; END IF;
  IF TG_OP='UPDATE' AND NEW.quote_id<>OLD.quote_id THEN RAISE EXCEPTION 'quote_file_identity_immutable'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION asir_crm.protect_quote_thread() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF NEW IS DISTINCT FROM OLD THEN RAISE EXCEPTION 'quote_number_immutable'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_quote_version ON asir_crm.quotes;
CREATE TRIGGER protect_quote_version BEFORE UPDATE ON asir_crm.quotes FOR EACH ROW EXECUTE FUNCTION asir_crm.protect_quote_version();
DROP TRIGGER IF EXISTS protect_quote_file ON asir_crm.quote_attachments;
CREATE TRIGGER protect_quote_file BEFORE INSERT OR UPDATE OR DELETE ON asir_crm.quote_attachments FOR EACH ROW EXECUTE FUNCTION asir_crm.protect_quote_file();
DROP TRIGGER IF EXISTS protect_quote_thread ON asir_crm.quote_threads;
CREATE TRIGGER protect_quote_thread BEFORE UPDATE ON asir_crm.quote_threads FOR EACH ROW EXECUTE FUNCTION asir_crm.protect_quote_thread();

DO $$ DECLARE tab TEXT; BEGIN
  FOREACH tab IN ARRAY ARRAY['quote_threads','quotes','quote_attachments','quote_tokens','quote_dispatches','quote_events'] LOOP
    EXECUTE format('ALTER TABLE asir_crm.%I ENABLE ROW LEVEL SECURITY',tab);
    EXECUTE format('REVOKE ALL ON asir_crm.%I FROM PUBLIC',tab);
    IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN EXECUTE format('REVOKE ALL ON asir_crm.%I FROM anon',tab); END IF;
    IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN EXECUTE format('REVOKE ALL ON asir_crm.%I FROM authenticated',tab); END IF;
  END LOOP;
END $$;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA asir_crm FROM PUBLIC;
INSERT INTO asir_crm.schema_migrations(name) VALUES ('202609170001_quotes') ON CONFLICT DO NOTHING;
COMMIT;
