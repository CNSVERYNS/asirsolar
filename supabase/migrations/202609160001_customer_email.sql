BEGIN;
SELECT pg_advisory_xact_lock(864209001);
-- Existing deliveries remain team notifications. Do not create receipts for old leads.
ALTER TABLE asir_crm.email_outbox ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'team'
  CHECK (purpose IN ('team', 'customer_receipt'));
ALTER TABLE asir_crm.email_outbox DROP CONSTRAINT IF EXISTS email_outbox_lead_id_recipient_key;
CREATE UNIQUE INDEX IF NOT EXISTS email_outbox_lead_recipient_purpose
  ON asir_crm.email_outbox(lead_id, recipient, purpose);
INSERT INTO asir_crm.schema_migrations(name) VALUES ('202609160001_customer_email') ON CONFLICT DO NOTHING;
COMMIT;
