import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
Object.assign(process.env,{DATABASE_URL:'',VERCEL:'',CRM_LOCAL_DATABASE:'true',CRM_LOCAL_PATH:'memory://',CRM_EMAIL_ENABLED:'false',CRM_SMS_ENABLED:'false',CRM_ZEPTOMAIL_TOKEN:'',CRM_SMTP_PASSWORD:'',CRM_NETGSM_PASSWORD:''});
const db=await import('../lib/crm/database.ts');
const auth=await import('../lib/crm/auth.ts');
const contacts=await import('../lib/crm/contacts-repository.ts');
const leads=await import('../lib/crm/repository.ts');
const input={name:'Ahmet Yılmaz',phone:'0532 123 45 67',email:'ahmet@example.invalid',company:'Örnek Fabrika',address:''};
const leadInput={...input,projectType:'Çatı Tipi',message:'',source:'phone',stage:'new',assigneeId:null,priority:'normal',nextFollowUp:null,quoteCents:null,rejectionReason:''};
const list=(params={})=>contacts.listContacts(new URLSearchParams(params));
const status=code=>error=>error.status===code;
test('contact directory: storage, matching, editing and pagination',async t=>{
 t.after(()=>db.closeDatabase());
 const actor=await auth.provisionAdmin(auth.adminAccounts[0].email,'Contact-test-only-2026!');
 let person;
 await t.test('manual person is independent from leads, quote counters and notifications; retry idempotency',async()=>{
  const key=randomUUID();person=(await contacts.createContact(input,key,actor.id)).contact;
  assert.equal((await contacts.createContact(input,key,actor.id)).contact.id,person.id);
  await assert.rejects(contacts.createContact({...input,name:'Başka kişi'},key,actor.id),status(409));
  assert.equal((await list()).total,1);
  for(const table of ['leads','quotes','email_outbox','sms_outbox'])assert.equal((await db.getDatabase().prepare(`SELECT count(*) AS total FROM asir_crm.${table}`).get()).total,0);
  assert.equal((await db.getDatabase().prepare('SELECT is_called FROM asir_crm.lead_reference_seq').get()).is_called,false);
 });
 await t.test('website/manual leads link to matching people without changing historical records',async()=>{
  const lead=(await leads.createManualLead(leadInput,actor)).lead;
  const another=(await leads.createManualLead({...leadInput,phone:'+90 532 123 45 67'},actor)).lead;
  assert.notEqual(lead.id,another.id);assert.equal((await list()).total,1);
  const detail=await contacts.getContact(person.id);assert.equal(detail.leadCount,2);assert.ok(detail.leads.some(l=>l.reference==='ASR-TLP-1'));
  assert.equal(detail.contact.phone,input.phone);
  assert.deepEqual(Object.keys(detail.contact).sort(),['address','company','createdAt','email','id','name','phone','updatedAt','version'].sort());
 });
 await t.test('same shared phone does not merge different people, normalized name/phone deduplicates concurrent creates',async()=>{
  await contacts.createContact({...input,name:'Elif Demir'},randomUUID(),actor.id);
  const entries=await Promise.all(['05321110000','+90 532 111 00 00','00905321110000'].map(phone=>contacts.createContact({...input,name:'IŞIK   İNCE',phone},randomUUID(),actor.id)));
  assert.equal(new Set(entries.map(row=>row.contact.id)).size,1);
  const again=await contacts.createContact({...input,name:'ışık ince',phone:'5321110000'},randomUUID(),actor.id);assert.equal(again.contact.id,entries[0].contact.id);
 });
 await t.test('contact edits preserve lead snapshots, optimistic concurrency, historical identity aliases',async()=>{
  person=await contacts.updateContact(person.id,{...person,address:'İzmit / Kocaeli\nSanayi Caddesi 42',phone:'05329990000'},actor.id);
  await assert.rejects(contacts.updateContact(person.id,{...person,version:1},actor.id),status(409));
  const detail=await contacts.getContact(person.id);
  for(const lead of detail.leads)assert.notEqual((await leads.getLead(lead.id)).lead.phone,person.phone);
  await leads.createManualLead({...leadInput,company:'Form şirketi'},actor);
  await leads.createManualLead({...leadInput,phone:person.phone},actor);
  assert.equal((await contacts.getContact(person.id)).leadCount,4);
  assert.equal((await contacts.getContact(person.id)).contact.company,input.company);
  const other=(await list({q:'Elif'})).contacts[0];
  await assert.rejects(contacts.updateContact(other.id,{...other,name:input.name,phone:input.phone},actor.id),status(409));
 });
 await t.test('validation: types, CRLF, email, phone, address, request key and missing record',async()=>{
  for(const patch of [{name:'x'},{phone:'javascript:alert(1)'},{phone:'123'},{email:'a@example.com\r\nBcc: b@example.com'},{name:'A\nB'},{address:'a'.repeat(1001)},{address:'abc\u0000'},{company:5}])assert.throws(()=>contacts.parseContact({...input,...patch}));
  await assert.rejects(contacts.createContact(input,'invalid',actor.id),status(400));
  await assert.rejects(contacts.getContact(randomUUID()),status(404));
  assert.equal(contacts.parseContact({...input,name:'<script>alert(1)</script>'}).name,'<script>alert(1)</script>');
  const source=await readFile('components/admin/ContactDirectory.tsx','utf8');assert.doesNotMatch(source,/dangerouslySetInnerHTML|draggable|onDrop/);
 });
 await t.test('201+ contacts: bounded 25-row pages, literal search, phone search, stable ordering, no N+1 list',async()=>{
  for(let i=0;i<201;i++)await contacts.createContact({name:`Test ${String(i).padStart(3,'0')}`,company:i===0?'100%_Solar':'Fabrika',phone:'',email:'',address:i===0?'Bursa Nilüfer':''},randomUUID(),actor.id);
  const first=await list(),second=await list({page:'2'});assert.equal(first.total,204);assert.equal(first.contacts.length,25);assert.equal(second.contacts.length,25);
  assert.ok(!first.contacts.some(row=>second.contacts.some(other=>other.id===row.id)));
  const last=await list({page:'999999'});assert.equal(last.page,9);assert.equal(last.contacts.length,4);
  assert.equal((await list({q:'100%_Solar'})).total,1);assert.equal((await list({q:'Bursa'})).total,1);
  assert.ok((await list({q:'5329990000'})).contacts.some(row=>row.id===person.id));
  assert.equal((await list({q:'no_such_person'})).total,0);
  assert.equal((await list({sort:'company'})).sort,'company');
  assert.doesNotMatch(JSON.stringify(first),/payload_hash|identity_key|created_by|quote_token/);
  const source=await readFile('lib/crm/contacts-repository.ts','utf8');const listing=source.slice(source.indexOf('export async function listContacts'),source.indexOf('async function contactById'));assert.equal((listing.match(/db\.prepare/g)||[]).length,2);
 });
 await t.test('reapplying additive migration preserves curated fields, links and lead/quote/outbox records',async()=>{
  const snapshot=async()=>{const state={};for(const table of ['contacts','contact_keys','lead_contacts','leads','quotes','quote_tokens','quote_events','email_outbox','sms_outbox'])state[table]=await db.getDatabase().prepare(`SELECT * FROM asir_crm.${table} ORDER BY 1`).all();return state;};
  const before=await snapshot();await db.migrateContactsModule();assert.deepEqual(await snapshot(),before);
  const privateTables=await db.getDatabase().prepare("SELECT relrowsecurity FROM pg_class WHERE oid IN ('asir_crm.contacts'::regclass,'asir_crm.contact_keys'::regclass,'asir_crm.lead_contacts'::regclass)").all();assert.ok(privateTables.every(row=>row.relrowsecurity));
 });
});
