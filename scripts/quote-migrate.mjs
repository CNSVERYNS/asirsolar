import env from '@next/env';
env.loadEnvConfig(process.cwd());
const { getDatabase, migrateQuoteModule, closeDatabase } = await import('../lib/crm/database.ts');

// No account provisioning, notification worker or provider imports/calls.
try {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL_required_for_hosted_migration');
  const db=getDatabase();
  const audit=await db.prepare("SELECT tablename,tableowner,rowsecurity FROM pg_tables WHERE schemaname='asir_crm' ORDER BY tablename").all();
  const columns=await db.prepare("SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='asir_crm' AND table_name IN ('leads','email_outbox','sms_outbox') ORDER BY table_name,ordinal_position").all();
  const required=[['leads','version'],['email_outbox','purpose'],['email_outbox','retryable'],['sms_outbox','retryable']];
  if(required.some(([table,column])=>!columns.some(row=>row.table_name===table&&row.column_name===column)))throw new Error('existing_CRM_migrations_required');
  console.log(JSON.stringify({mode:process.argv.includes('--apply')?'apply':'read-only',tables:audit,communicationSchema:columns}));
  if(process.argv.includes('--apply')) {
    const before={};for(const table of ['leads','email_outbox','sms_outbox'])before[table]=(await db.prepare(`SELECT id FROM ${table}`).all()).map(row=>row.id);
    await migrateQuoteModule();
    for(const table of ['leads','email_outbox','sms_outbox']) {
      const after=new Set((await db.prepare(`SELECT id FROM ${table}`).all()).map(row=>row.id));
      if(before[table].some(id=>!after.has(id)))throw new Error('existing_record_missing_after_migration');
    }
    const protectedTables=await db.prepare("SELECT tablename,rowsecurity,has_table_privilege('anon',format('%I.%I',schemaname,tablename),'SELECT') AS anonymous_read FROM pg_tables WHERE schemaname='asir_crm' AND (tablename='quotes' OR tablename LIKE 'quote_%') ORDER BY tablename").all();
    if(protectedTables.length!==6||protectedTables.some(row=>!row.rowsecurity||row.anonymous_read))throw new Error('quote_table_permissions_invalid');
    console.log(JSON.stringify({migration:'202609170001_quotes',existingRecordsPreserved:true,tables:protectedTables}));
  }
} catch(error) { console.error('Quote migration:',error.code||(/^[A-Za-z_]+$/.test(error.message)?error.message:error.name));process.exitCode=1; }
finally { await closeDatabase(); }
