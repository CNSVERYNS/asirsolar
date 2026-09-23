import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const migration=await readFile('supabase/migrations/202609180001_pipeline_references.sql','utf8');
const preceding=['202609090001_crm','202609110001_notifications','202609150001_projects','202609160001_customer_email','202609170001_quotes'];
async function fixture(){
 const db=new PGlite();for(const name of preceding)await db.exec(await readFile(`supabase/migrations/${name}.sql`,'utf8'));
 await db.exec(`
  INSERT INTO asir_crm.users(id,email,name,password_hash,created_at) VALUES('admin','test@example.invalid','Test','unused','2026-01-01');
  INSERT INTO asir_crm.leads(id,reference,name,project_type,source,created_at,updated_at) VALUES
   ('b','ASR-260101-AAAA','Later ID','Çatı Tipi','phone','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z'),
   ('a','ASR-260101-BBBB','Earlier ID','Çatı Tipi','phone','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
  INSERT INTO asir_crm.quote_threads(id,lead_id,quote_number,created_at) VALUES('thread','a','ASR-TKF-260101-0001','2026-01-01');
  INSERT INTO asir_crm.quotes(id,thread_id,lead_id,version,customer_name,customer_email,customer_phone,project_type,title,message,amount_cents,currency,vat_mode,valid_until,created_by,created_at,updated_at,creation_key,creation_hash)
   VALUES('q1','thread','a',1,'Earlier ID','test@example.invalid','05321234567','Çatı Tipi','Teklif','Mesaj',10000,'TRY','included','2027-01-01','admin','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z','create1','hash1');
  INSERT INTO asir_crm.quote_attachments(id,quote_id,original_filename,mime_type,size_bytes,data,sha256,created_at) VALUES('file','q1','offer.pdf','application/pdf',3,decode('010203','hex'),'test-hash','2026-01-01');
  UPDATE asir_crm.quotes SET status='sent',sent_at='2026-01-01T00:01:00Z' WHERE id='q1';
  INSERT INTO asir_crm.quotes(id,thread_id,lead_id,version,customer_name,customer_email,customer_phone,project_type,title,message,amount_cents,currency,vat_mode,valid_until,created_by,created_at,updated_at,creation_key,creation_hash)
   VALUES('q2','thread','a',2,'Earlier ID','test@example.invalid','05321234567','Çatı Tipi','Revizyon','Yeni mesaj',11000,'TRY','included','2027-01-01','admin','2026-01-02T00:00:00Z','2026-01-02T00:00:00Z','create2','hash2');
  INSERT INTO asir_crm.quote_tokens(token_hash,quote_id,created_at) VALUES(repeat('a',64),'q1','2026-01-01');
  INSERT INTO asir_crm.quote_events(id,quote_id,actor_type,kind,content,created_at) VALUES('event','q1','admin','quote_sent','Sent history','2026-01-01');
  INSERT INTO asir_crm.lead_events(id,lead_id,kind,content,created_at) VALUES('event','a','quote_sent','ASR-TKF-260101-0001 · V1: Sent history','2026-01-01');
  INSERT INTO asir_crm.email_outbox(id,lead_id,quote_id,recipient,purpose,status,quote_token) VALUES('mail','a','q1','test@example.invalid','quote_customer','held',repeat('x',43));
 `);return db;
}
const rows=async(db,query)=>(await db.query(query)).rows;
async function protectedRows(db){const result={};for(const table of ['quote_tokens','quote_attachments','quote_events','lead_events','email_outbox','sms_outbox','quote_threads'])result[table]=await rows(db,`SELECT * FROM asir_crm.${table}`);result.quotes=await rows(db,'SELECT id,thread_id,lead_id,version,status,amount_cents,message,created_at FROM asir_crm.quotes ORDER BY id');return result;}
test('contact backfill preserves existing quotes, tokens, files and notification jobs',async()=>{
 const db=await fixture();try{
  await db.exec(migration);
  await db.exec("UPDATE asir_crm.leads SET name='Same Person',phone='05321234567',company=CASE WHEN id='a' THEN 'Earliest company' ELSE 'Later company' END");
  const before=await protectedRows(db),leadRows=await rows(db,'SELECT * FROM asir_crm.leads ORDER BY id');
  const contactsMigration=await readFile('supabase/migrations/202609230001_contacts.sql','utf8');
  await db.exec(contactsMigration);
  assert.deepEqual(await protectedRows(db),before);assert.deepEqual(await rows(db,'SELECT * FROM asir_crm.leads ORDER BY id'),leadRows);
  const people=await rows(db,'SELECT * FROM asir_crm.contacts');assert.equal(people.length,1);assert.equal(people[0].company,'Earliest company');assert.equal(people[0].address,'');
  assert.equal((await rows(db,'SELECT * FROM asir_crm.lead_contacts')).length,2);
  await db.exec(contactsMigration);assert.deepEqual(await rows(db,'SELECT * FROM asir_crm.contacts'),people);assert.deepEqual(await protectedRows(db),before);
 }finally{await db.close();}
});
test('reference backfill preserves IDs, tokens, bytes, history and outbox; deterministic and repeatable',async()=>{
 const db=await fixture();try{
  const before=await protectedRows(db);await db.exec(migration);
  assert.deepEqual(await protectedRows(db),before);
  assert.deepEqual(await rows(db,'SELECT id,reference_number FROM asir_crm.leads ORDER BY id'),[{id:'a',reference_number:'ASR-TLP-1'},{id:'b',reference_number:'ASR-TLP-2'}]);
  assert.deepEqual((await rows(db,'SELECT quote_number FROM asir_crm.quotes ORDER BY id')).map(row=>row.quote_number),['ASR-TKLF-1','ASR-TKLF-2']);
  await db.exec(migration);assert.deepEqual(await protectedRows(db),before);
  await db.exec("INSERT INTO asir_crm.leads(id,name,project_type,source,created_at,updated_at) VALUES('c','Next','Çatı Tipi','phone','2026-01-03','2026-01-03')");
  assert.deepEqual(await rows(db,"SELECT reference,reference_number FROM asir_crm.leads WHERE id='c'"),[{reference:'ASR-TLP-3',reference_number:'ASR-TLP-3'}]);
  assert.equal((await rows(db,"SELECT nextval('asir_crm.quote_reference_seq') AS n"))[0].n,3);
  await db.exec(migration);assert.equal((await rows(db,"SELECT nextval('asir_crm.quote_reference_seq') AS n"))[0].n,4,'reapply cannot rewind counter');
 }finally{await db.close();}
});
test('preassigned short references survive and counters advance beyond them',async()=>{
 const db=await fixture();try{
  await db.exec("ALTER TABLE asir_crm.leads ADD COLUMN reference_number text; UPDATE asir_crm.leads SET reference_number='ASR-TLP-7' WHERE id='b'; ALTER TABLE asir_crm.quotes ADD COLUMN quote_number text; UPDATE asir_crm.quotes SET quote_number='ASR-TKLF-9' WHERE id='q2';");
  await db.exec(migration);
  assert.deepEqual((await rows(db,'SELECT reference_number FROM asir_crm.leads ORDER BY id')).map(row=>row.reference_number),['ASR-TLP-8','ASR-TLP-7']);
  assert.deepEqual((await rows(db,'SELECT quote_number FROM asir_crm.quotes ORDER BY id')).map(row=>row.quote_number),['ASR-TKLF-10','ASR-TKLF-9']);
  assert.equal((await rows(db,"SELECT nextval('asir_crm.lead_reference_seq') AS n"))[0].n,9);
  assert.equal((await rows(db,"SELECT nextval('asir_crm.quote_reference_seq') AS n"))[0].n,11);
 }finally{await db.close();}
});
