BEGIN;
SET LOCAL lock_timeout = '5s';
SELECT pg_advisory_xact_lock(864209001);
-- Serialize backfill with old and new application writes; no token/history/outbox changes.
LOCK TABLE asir_crm.leads, asir_crm.quote_threads, asir_crm.quotes IN SHARE ROW EXCLUSIVE MODE;
CREATE SEQUENCE IF NOT EXISTS asir_crm.lead_reference_seq MAXVALUE 999999999999;
CREATE SEQUENCE IF NOT EXISTS asir_crm.quote_reference_seq MAXVALUE 999999999999;
ALTER TABLE asir_crm.leads ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE asir_crm.leads ADD COLUMN IF NOT EXISTS pipeline_phase TEXT NOT NULL DEFAULT 'new' CHECK(pipeline_phase IN ('new','reviewing','preparing'));
ALTER TABLE asir_crm.quotes ADD COLUMN IF NOT EXISTS quote_number TEXT;
ALTER TABLE asir_crm.quotes ADD COLUMN IF NOT EXISTS legacy_quote_number TEXT;

-- Existing legacy columns remain intact for historical lookup and rolling deployments.
UPDATE asir_crm.leads SET reference_number=reference
 WHERE reference_number IS NULL AND reference ~ '^ASR-TLP-[1-9][0-9]{0,11}$';
UPDATE asir_crm.quotes q SET legacy_quote_number=COALESCE(q.quote_number,t.quote_number)
 FROM asir_crm.quote_threads t WHERE t.id=q.thread_id AND q.legacy_quote_number IS NULL;
-- If a thread already had a short number, only its earliest version may retain it.
WITH first_version AS (
 SELECT q.id,t.quote_number,row_number() OVER(PARTITION BY q.thread_id ORDER BY q.created_at,q.id) AS position
 FROM asir_crm.quotes q JOIN asir_crm.quote_threads t ON t.id=q.thread_id
) UPDATE asir_crm.quotes q SET quote_number=f.quote_number FROM first_version f
 WHERE q.id=f.id AND q.quote_number IS NULL AND f.position=1 AND f.quote_number ~ '^ASR-TKLF-[1-9][0-9]{0,11}$'
 AND NOT EXISTS(SELECT 1 FROM asir_crm.quotes existing WHERE existing.quote_number=f.quote_number);
CREATE UNIQUE INDEX IF NOT EXISTS leads_reference_number_unique ON asir_crm.leads(reference_number);
CREATE UNIQUE INDEX IF NOT EXISTS quotes_number_unique ON asir_crm.quotes(quote_number);
DO $$ DECLARE high BIGINT; row_record RECORD; BEGIN
 SELECT greatest(COALESCE(max(substring(reference_number FROM '^ASR-TLP-([0-9]+)$')::bigint),0),
   (SELECT CASE WHEN is_called THEN last_value ELSE 0 END FROM asir_crm.lead_reference_seq)) INTO high FROM asir_crm.leads;
 PERFORM setval('asir_crm.lead_reference_seq',greatest(high,1),high>0);
 FOR row_record IN SELECT id FROM asir_crm.leads WHERE reference_number IS NULL ORDER BY created_at,id LOOP
   UPDATE asir_crm.leads SET reference_number='ASR-TLP-' || nextval('asir_crm.lead_reference_seq') WHERE id=row_record.id;
 END LOOP;
 SELECT greatest(COALESCE(max(substring(quote_number FROM '^ASR-TKLF-([0-9]+)$')::bigint),0),
   (SELECT CASE WHEN is_called THEN last_value ELSE 0 END FROM asir_crm.quote_reference_seq)) INTO high FROM asir_crm.quotes;
 PERFORM setval('asir_crm.quote_reference_seq',greatest(high,1),high>0);
 FOR row_record IN SELECT id FROM asir_crm.quotes WHERE quote_number IS NULL ORDER BY created_at,id LOOP
   UPDATE asir_crm.quotes SET quote_number='ASR-TKLF-' || nextval('asir_crm.quote_reference_seq') WHERE id=row_record.id;
 END LOOP;
END $$;
ALTER TABLE asir_crm.leads ALTER COLUMN reference_number SET NOT NULL;
ALTER TABLE asir_crm.leads ALTER COLUMN reference_number SET DEFAULT ('ASR-TLP-' || nextval('asir_crm.lead_reference_seq'));
ALTER TABLE asir_crm.quotes ALTER COLUMN quote_number SET NOT NULL;
ALTER TABLE asir_crm.quotes ALTER COLUMN quote_number SET DEFAULT ('ASR-TKLF-' || nextval('asir_crm.quote_reference_seq'));
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='asir_crm.leads'::regclass AND conname='lead_reference_format') THEN
  ALTER TABLE asir_crm.leads ADD CONSTRAINT lead_reference_format CHECK(reference_number ~ '^ASR-TLP-[1-9][0-9]{0,11}$');
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='asir_crm.quotes'::regclass AND conname='quote_reference_format') THEN
  ALTER TABLE asir_crm.quotes ADD CONSTRAINT quote_reference_format CHECK(quote_number ~ '^ASR-TKLF-[1-9][0-9]{0,11}$');
 END IF;
END $$;
CREATE OR REPLACE FUNCTION asir_crm.protect_lead_reference() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='INSERT' THEN NEW.reference=COALESCE(NEW.reference,NEW.reference_number);
 ELSIF NEW.reference_number IS DISTINCT FROM OLD.reference_number THEN RAISE EXCEPTION 'lead_reference_immutable'; END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION asir_crm.protect_quote_reference() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF OLD.quote_number IS NOT NULL AND NEW.quote_number IS DISTINCT FROM OLD.quote_number THEN RAISE EXCEPTION 'quote_reference_immutable'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_lead_reference ON asir_crm.leads;
CREATE TRIGGER protect_lead_reference BEFORE INSERT OR UPDATE ON asir_crm.leads FOR EACH ROW EXECUTE FUNCTION asir_crm.protect_lead_reference();
DROP TRIGGER IF EXISTS protect_quote_reference ON asir_crm.quotes;
CREATE TRIGGER protect_quote_reference BEFORE UPDATE ON asir_crm.quotes FOR EACH ROW EXECUTE FUNCTION asir_crm.protect_quote_reference();
CREATE INDEX IF NOT EXISTS quotes_pipeline_latest ON asir_crm.quotes(lead_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS events_lead_activity ON asir_crm.lead_events(lead_id,created_at DESC,sequence DESC);
REVOKE ALL ON SEQUENCE asir_crm.lead_reference_seq,asir_crm.quote_reference_seq FROM PUBLIC;
INSERT INTO asir_crm.schema_migrations(name) VALUES ('202609180001_pipeline_references') ON CONFLICT DO NOTHING;
COMMIT;
