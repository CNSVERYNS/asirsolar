-- Run as the Supabase database administrator, after deploying the POST endpoint.
-- First create these secrets in Supabase Vault:
-- asir_crm_cron_secret = the same CRON_SECRET as the Vercel production environment
-- asir_crm_notification_url = https://asirsolar.vercel.app/api/cron/bildirimler
-- Never paste a secret into this tracked file or directly into cron.job.command.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
-- Request headers contain the cron credential until the HTTP request completes.
REVOKE ALL ON ALL TABLES IN SCHEMA net FROM PUBLIC, anon, authenticated, asir_crm_app;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA net FROM PUBLIC, anon, authenticated, asir_crm_app;
DO $$ BEGIN
  IF (SELECT count(*) FROM vault.decrypted_secrets WHERE name IN ('asir_crm_cron_secret','asir_crm_notification_url') AND length(decrypted_secret)>0) <> 2 THEN
    RAISE EXCEPTION 'Create the two Asir CRM Vault secrets before scheduling notifications';
  END IF;
END $$;
SELECT cron.schedule(
  'asir-crm-notifications',
  '*/2 * * * *',
  $job$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='asir_crm_notification_url'),
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' ||
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='asir_crm_cron_secret')),
      body := '{}'::jsonb,
      timeout_milliseconds := 55000
    ) AS request_id;
  $job$
);
COMMIT;
