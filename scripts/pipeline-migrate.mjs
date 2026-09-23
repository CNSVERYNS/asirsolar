import env from '@next/env';
import {createHash} from 'node:crypto';
env.loadEnvConfig(process.cwd());
const {getDatabase,migratePipelineModule,closeDatabase}=await import('../lib/crm/database.ts');
const queries={
 leads:'id,reference,submission_key,payload_hash,created_at',
 quotes:'id,thread_id,lead_id,version,customer_name,customer_email,customer_phone,project_type,title,message,amount_cents,currency,vat_mode,valid_until,created_by,created_at',
 quote_threads:'*',quote_tokens:'*',
 quote_attachments:"id,quote_id,original_filename,mime_type,size_bytes,sha256,md5(encode(data,'hex')) AS content_hash,created_at",
 quote_events:'*',lead_events:'*',
 email_outbox:'id,lead_id,quote_id,recipient,purpose',sms_outbox:'id,lead_id,quote_id,recipient',quote_dispatches:'*',
};
async function snapshot(){
 const result={};
 for(const [table,columns] of Object.entries(queries)){
  const rows=await getDatabase().prepare(`SELECT ${columns} FROM asir_crm.${table}`).all();
  // Private data exists only in process memory. Print counts and equality results, never row bodies/tokens.
  result[table]=new Map(rows.map(row=>[row.id??row.token_hash,createHash('sha256').update(JSON.stringify(row)).digest('hex')]));
 }
 return result;
}
try{
 if(!process.env.DATABASE_URL)throw new Error('hosted_database_required');
 const before=await snapshot();
 const beforeCounts=Object.fromEntries(Object.entries(before).map(([key,rows])=>[key,rows.size]));
 console.log(JSON.stringify({mode:process.argv.includes('--apply')?'apply':'read-only',beforeCounts}));
 if(process.argv.includes('--apply')){
  await migratePipelineModule();const after=await snapshot();
  for(const [table,rows] of Object.entries(before)){
   if(rows.size!==after[table].size)throw new Error('row_counts_changed_during_migration');
   for(const [id,hash] of rows)if(after[table].get(id)!==hash)throw new Error('protected_record_changed_during_migration');
  }
  console.log(JSON.stringify({migration:'202609180001_pipeline_references',protectedDataUnchanged:true,afterCounts:Object.fromEntries(Object.entries(after).map(([key,rows])=>[key,rows.size]))}));
 }
 const migrated=await getDatabase().prepare("SELECT name FROM asir_crm.schema_migrations WHERE name='202609180001_pipeline_references'").get();
 if(migrated){
  const references={};
  for(const [table,column,sequence] of [['leads','reference_number','lead_reference_seq'],['quotes','quote_number','quote_reference_seq']]){
   const rows=await getDatabase().prepare(`SELECT ${column} AS reference FROM asir_crm.${table} ORDER BY created_at,id`).all();
   const counter=await getDatabase().prepare(`SELECT last_value,is_called FROM asir_crm.${sequence}`).get();
   const invalid=await getDatabase().prepare(`SELECT count(*) AS total FROM asir_crm.${table} WHERE ${column} IS NULL`).get();
   if(invalid.total)throw new Error('missing_reference_after_migration');
   references[table]={first:rows[0]?.reference??null,last:rows.at(-1)?.reference??null,sequence,lastValue:Number(counter.last_value),isCalled:counter.is_called,nextValue:Number(counter.last_value)+(counter.is_called?1:0)};
  }
  console.log(JSON.stringify({references}));
 }
}catch(error){console.error('Pipeline migration:',error.code||(/^[a-z_]+$/.test(error.message)?error.message:error.name));process.exitCode=1;}
finally{await closeDatabase();}
