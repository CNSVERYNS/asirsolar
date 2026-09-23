import env from '@next/env';
import { createHash } from 'node:crypto';
env.loadEnvConfig(process.cwd());
const { getDatabase, migrateContactsModule, closeDatabase } = await import('../lib/crm/database.ts');
const tables = ['leads','quotes','quote_threads','quote_tokens','quote_events','lead_events','quote_dispatches'];
async function snapshot() {
 const state = {};
 for (const table of tables) {
  const rows = await getDatabase().prepare(`SELECT * FROM asir_crm.${table} ORDER BY 1`).all();
  state[table] = { count: rows.length, hash: createHash('sha256').update(JSON.stringify(rows)).digest('hex') };
 }
 for (const [table, columns] of [
  ['quote_attachments',"id,quote_id,original_filename,mime_type,size_bytes,sha256,md5(encode(data,'hex')) AS content_hash,created_at"],
  ['email_outbox','id,lead_id,quote_id,recipient,purpose'], ['sms_outbox','id,lead_id,quote_id,recipient'],
 ]) {
  const rows = await getDatabase().prepare(`SELECT ${columns} FROM asir_crm.${table} ORDER BY id`).all();
  state[table] = { count: rows.length, hash: createHash('sha256').update(JSON.stringify(rows)).digest('hex') };
 }
 return state;
}
const counts = state => Object.fromEntries(Object.entries(state).map(([table, row]) => [table, row.count]));
try {
 if (!process.env.DATABASE_URL) throw new Error('hosted_database_required');
 const before = await snapshot();
 console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'read-only', before: counts(before) }));
 if (process.argv.includes('--apply')) {
  await migrateContactsModule();
  const after = await snapshot();
  const preserved = JSON.stringify(before) === JSON.stringify(after);
  console.log(JSON.stringify({ after: counts(after), protectedDataUnchanged: preserved }));
  if (!preserved) throw new Error('data_changed_during_migration_check_concurrent_activity');
 }
 const exists = await getDatabase().prepare("SELECT to_regclass('asir_crm.contacts') AS present").get();
 if (exists.present) {
  const people = await getDatabase().prepare('SELECT count(*) AS total FROM asir_crm.contacts').get();
  const linked = await getDatabase().prepare('SELECT count(*) AS total FROM asir_crm.lead_contacts').get();
  const missing = await getDatabase().prepare('SELECT count(*) AS total FROM asir_crm.leads l WHERE NOT EXISTS(SELECT 1 FROM asir_crm.lead_contacts lc WHERE lc.lead_id=l.id)').get();
  console.log(JSON.stringify({ contacts: people.total, linkedLeads: linked.total, unlinkedLeads: missing.total }));
  if (missing.total) throw new Error('unlinked_leads');
 }
} catch (error) {
 console.error('Contact migration:', error.code || (/^[a-z_]+$/.test(error.message) ? error.message : error.name));
 process.exitCode = 1;
} finally { await closeDatabase(); }
