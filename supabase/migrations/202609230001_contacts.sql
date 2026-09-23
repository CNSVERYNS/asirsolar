BEGIN;
SET LOCAL lock_timeout = '5s';
SELECT pg_advisory_xact_lock(864209001);
LOCK TABLE asir_crm.leads IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE IF NOT EXISTS asir_crm.contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 100),
  company TEXT NOT NULL DEFAULT '' CHECK(length(company) <= 150),
  phone TEXT NOT NULL DEFAULT '' CHECK(length(phone) <= 25),
  email TEXT NOT NULL DEFAULT '' CHECK(length(email) <= 254),
  address TEXT NOT NULL DEFAULT '' CHECK(length(address) <= 1000),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
  created_by TEXT REFERENCES asir_crm.users(id),
  updated_by TEXT REFERENCES asir_crm.users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS asir_crm.contact_keys (
  identity_key TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES asir_crm.contacts(id),
  payload_hash TEXT
);
CREATE TABLE IF NOT EXISTS asir_crm.lead_contacts (
  lead_id TEXT PRIMARY KEY REFERENCES asir_crm.leads(id),
  contact_id TEXT NOT NULL REFERENCES asir_crm.contacts(id)
);
CREATE INDEX IF NOT EXISTS contacts_name ON asir_crm.contacts(lower(name), id);
CREATE INDEX IF NOT EXISTS contacts_company ON asir_crm.contacts(lower(company), lower(name), id);
CREATE INDEX IF NOT EXISTS lead_contacts_person ON asir_crm.lead_contacts(contact_id, lead_id);
CREATE INDEX IF NOT EXISTS contact_keys_person ON asir_crm.contact_keys(contact_id);

CREATE OR REPLACE FUNCTION asir_crm.contact_identity(person_name TEXT, person_phone TEXT, person_email TEXT, fallback TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog AS $$
DECLARE normalized_name TEXT; normalized_phone TEXT;
BEGIN
  normalized_name := lower(regexp_replace(translate(trim(person_name), 'Iİı', 'iii'), '\s+', ' ', 'g'));
  normalized_phone := regexp_replace(person_phone, '[^0-9]', '', 'g');
  IF normalized_phone LIKE '00%' THEN normalized_phone := substr(normalized_phone, 3); END IF;
  IF length(normalized_phone) = 12 AND normalized_phone LIKE '90%' THEN normalized_phone := substr(normalized_phone, 3);
  ELSIF length(normalized_phone) = 11 AND normalized_phone LIKE '0%' THEN normalized_phone := substr(normalized_phone, 2); END IF;
  IF normalized_phone <> '' THEN RETURN 'person:' || normalized_name || ':phone:' || normalized_phone; END IF;
  IF trim(person_email) <> '' THEN RETURN 'person:' || normalized_name || ':email:' || lower(trim(person_email)); END IF;
  RETURN 'person:unmatched:' || fallback;
END $$;

-- Matching requires both a name and a phone/email, never a shared company alone.
-- Historical aliases survive contact edits; incoming forms do not overwrite curated data.
CREATE OR REPLACE FUNCTION asir_crm.ensure_contact(candidate_id TEXT, person_name TEXT, person_phone TEXT, person_email TEXT, person_company TEXT, person_address TEXT, recorded_at TEXT, actor_id TEXT)
RETURNS TEXT LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE match_key TEXT; matched_id TEXT;
BEGIN
  match_key := asir_crm.contact_identity(person_name, person_phone, person_email, candidate_id);
  PERFORM pg_advisory_xact_lock(hashtextextended(match_key, 0));
  SELECT contact_id INTO matched_id FROM asir_crm.contact_keys WHERE identity_key = match_key;
  IF matched_id IS NOT NULL THEN RETURN matched_id; END IF;
  INSERT INTO asir_crm.contacts(id, name, phone, email, company, address, created_at, updated_at, created_by, updated_by)
    VALUES(candidate_id, person_name, person_phone, person_email, person_company, person_address, recorded_at, recorded_at, actor_id, actor_id);
  INSERT INTO asir_crm.contact_keys(identity_key, contact_id) VALUES(match_key, candidate_id);
  RETURN candidate_id;
END $$;

CREATE OR REPLACE FUNCTION asir_crm.link_lead_contact() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  INSERT INTO asir_crm.lead_contacts(lead_id, contact_id)
    VALUES(NEW.id, asir_crm.ensure_contact(gen_random_uuid()::TEXT, NEW.name, NEW.phone, NEW.email, NEW.company, '', NEW.created_at, NULL));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS link_lead_contact ON asir_crm.leads;
CREATE TRIGGER link_lead_contact AFTER INSERT ON asir_crm.leads FOR EACH ROW EXECUTE FUNCTION asir_crm.link_lead_contact();

DO $$ DECLARE lead RECORD;
BEGIN
  FOR lead IN SELECT l.* FROM asir_crm.leads l WHERE NOT EXISTS(SELECT 1 FROM asir_crm.lead_contacts lc WHERE lc.lead_id = l.id) ORDER BY l.created_at, l.id LOOP
    INSERT INTO asir_crm.lead_contacts(lead_id, contact_id)
      VALUES(lead.id, asir_crm.ensure_contact(gen_random_uuid()::TEXT, lead.name, lead.phone, lead.email, lead.company, '', lead.created_at, NULL));
  END LOOP;
END $$;

ALTER TABLE asir_crm.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE asir_crm.contact_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE asir_crm.lead_contacts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON asir_crm.contacts, asir_crm.contact_keys, asir_crm.lead_contacts FROM PUBLIC;
REVOKE ALL ON FUNCTION asir_crm.contact_identity(TEXT,TEXT,TEXT,TEXT), asir_crm.ensure_contact(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT), asir_crm.link_lead_contact() FROM PUBLIC;
DO $$ DECLARE role_name TEXT;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON asir_crm.contacts, asir_crm.contact_keys, asir_crm.lead_contacts FROM %I', role_name);
      EXECUTE format('REVOKE ALL ON FUNCTION asir_crm.contact_identity(TEXT,TEXT,TEXT,TEXT), asir_crm.ensure_contact(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT), asir_crm.link_lead_contact() FROM %I', role_name);
    END IF;
  END LOOP;
END $$;
INSERT INTO asir_crm.schema_migrations(name) VALUES('202609230001_contacts') ON CONFLICT DO NOTHING;
COMMIT;
