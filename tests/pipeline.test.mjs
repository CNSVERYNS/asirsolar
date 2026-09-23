import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
Object.assign(process.env,{DATABASE_URL:'',CRM_LOCAL_DATABASE:'true',CRM_LOCAL_PATH:'memory://',CRM_EMAIL_ENABLED:'false',CRM_SMS_ENABLED:'false',CRM_QUOTES_SEND_ENABLED:'true',CRM_ZEPTOMAIL_TOKEN:'',CRM_SMTP_PASSWORD:'',CRM_NETGSM_PASSWORD:'',APP_ORIGIN:'https://www.asirsolar.com'});
const db=await import('../lib/crm/database.ts');
const auth=await import('../lib/crm/auth.ts');
const leads=await import('../lib/crm/repository.ts');
const quotes=await import('../lib/quotes/repository.ts');
const pipeline=await import('../lib/crm/pipeline-repository.ts');
const {parseQuote:parseQuoteInput}=await import('../lib/quotes/validation.ts');
const {defaultQuoteDate}=await import('../lib/quotes/types.ts');
const {renderQuoteEmail}=await import('../lib/quotes/templates.ts');
const {renderNotificationEmail}=await import('../lib/crm/notification-templates.ts');
const leadInput={name:'Pipeline Test',email:'pipeline@example.invalid',phone:'05321234567',company:'',projectType:'Çatı Tipi',message:'',source:'phone',stage:'new',assigneeId:null,priority:'normal',nextFollowUp:null,quoteCents:null,rejectionReason:''};
const input=(overrides={})=>parseQuoteInput({title:'Çatı GES Teklifi',message:'Teklif mesajı',amount:'420000',currency:'TRY',vatMode:'included',validUntil:defaultQuoteDate(),emailRequested:true,smsRequested:false,...overrides});
const status=code=>error=>error.status===code;
test('pipeline and independent reference sequences',async t=>{
 t.after(()=>db.closeDatabase());
 const actor=await auth.provisionAdmin(auth.adminAccounts[0].email,'Test-pipeline-only-2026!');
 const create=async(overrides={})=>(await leads.createManualLead({...leadInput,...overrides},actor)).lead;
 const board=(params={})=>pipeline.listPipeline(new URLSearchParams(params));
 const card=async id=>(await board()).cards.find(item=>item.id===id);
 const move=async(id,stage,extra={})=>{const current=await card(id);return pipeline.movePipeline(id,{stage,version:current.version,expectedStage:current.stage,expectedActivity:current.lastActivityAt,...extra},actor);};
 let first,second,quote,token;
 await t.test('first/second references, independent quote sequence, UUID and number immutability',async()=>{
  first=await create();second=await create();assert.equal(first.reference,'ASR-TLP-1');assert.equal(second.reference,'ASR-TLP-2');assert.match(first.id,/^[a-f0-9-]{36}$/);
  quote=await quotes.createQuote(first.id,input(),actor,randomUUID());assert.equal(quote.quoteNumber,'ASR-TKLF-1');assert.equal(quote.leadReference,first.reference);
  assert.equal((await create()).reference,'ASR-TLP-3');assert.equal((await quotes.createQuote(second.id,input({currency:'USD',amount:'100'}),actor,randomUUID())).quoteNumber,'ASR-TKLF-2');
  await assert.rejects(db.getDatabase().prepare("UPDATE leads SET reference_number='ASR-TLP-99' WHERE id=?").run(first.id));
  await assert.rejects(db.getDatabase().prepare("UPDATE asir_crm.quotes SET quote_number='ASR-TKLF-99' WHERE id=?").run(quote.id));
  assert.equal((await leads.getLead(first.id)).lead.id,first.id);
 });
 await t.test('concurrent creation is unique and duplicate form keeps reference',async()=>{
  const created=await Promise.all(Array.from({length:8},()=>create()));assert.equal(new Set(created.map(item=>item.reference)).size,8);
  const key=randomUUID(),enquiry={...leadInput,consent:true,message:'Çatı keşif talebi'};
  const submissions=await Promise.all(Array.from({length:5},()=>leads.createWebsiteLead(enquiry,key)));assert.equal(new Set(submissions.map(item=>item.id)).size,1);assert.equal(new Set(submissions.map(item=>item.reference)).size,1);
 });
 await t.test('grouping, totals and currency-separated open value',async()=>{
  const result=await board();assert.equal(result.counts.preparing,2);assert.equal(result.total,result.cards.length);assert.equal(result.summary.amounts.TRY,42000000);assert.equal(result.summary.amounts.USD,10000);
  assert.equal(Object.values(result.counts).reduce((a,b)=>a+b,0),result.total);
  assert.ok(!JSON.stringify(result).includes('quote_token'));assert.ok(!JSON.stringify(result).includes('legacy_quote_number'));assert.ok(!JSON.stringify(result).includes('customer_email'));
 });
 await t.test('search by both references, customer, email, phone and project; filters/sort',async()=>{
  for(const search of [first.reference,quote.quoteNumber]){const result=await board({q:search});assert.ok(result.cards.some(item=>item.id===first.id));}
  assert.equal((await leads.listLeads(new URLSearchParams({q:quote.quoteNumber}))).total,1);
  for(const search of ['Pipeline','pipeline@example.invalid','05321234567','Çatı Tipi'])assert.ok((await board({q:search})).total>0);
  assert.equal((await board({quote:'yes'})).total,2);assert.equal((await board({viewed:'yes'})).total,0);assert.equal((await board({stage:'preparing'})).total,2);
  assert.equal((await board({project:'Arazi Tipi'})).total,0);assert.equal((await board({from:'2099-01-01'})).total,0);assert.equal((await board({q:"' OR 1=1 --"})).total,0);
  assert.equal((await board({sort:'oldest'})).cards[0].id,first.id);await assert.rejects(board({sort:'sql'}),status(400));await assert.rejects(board({from:'2026-02-30'}),status(400));
 });
 await t.test('manual stages, optimistic conflict, lost reason, no fake automatic status',async()=>{
  const lead=await create();const initial=await card(lead.id);await move(lead.id,'reviewing');assert.equal((await card(lead.id)).stage,'reviewing');
  await assert.rejects(pipeline.movePipeline(lead.id,{stage:'preparing',version:initial.version,expectedStage:initial.stage,expectedActivity:initial.lastActivityAt},actor),status(409));
  await move(lead.id,'preparing');assert.equal((await card(lead.id)).stage,'preparing');await assert.rejects(move(lead.id,'viewed'),status(409));
  await assert.rejects(move(lead.id,'lost'),status(400));await move(lead.id,'lost',{reason:'Diğer',note:'Bütçe gelecek yıl.'});assert.equal((await card(lead.id)).stage,'lost');
  assert.match((await leads.getLead(lead.id)).lead.rejectionReason,/Bütçe/);await move(lead.id,'reviewing');assert.equal((await card(lead.id)).stage,'reviewing');
 });
 await t.test('quote send/view/revision automatically move pipeline; revision has a new reference',async()=>{
  await quotes.sendQuote(quote.id,1,randomUUID(),actor);assert.equal((await card(first.id)).stage,'sent');token=(await quotes.copyQuoteLink(quote.id,actor)).url.split('/').pop();
  await assert.rejects(move(first.id,'new'),status(409));await quotes.viewPublicQuote(token);assert.equal((await card(first.id)).stage,'viewed');
  await quotes.actOnPublicQuote(token,'revision','Batarya eklensin.');assert.equal((await card(first.id)).stage,'revision_requested');
  const revision=await quotes.createQuote(first.id,input(),actor,randomUUID(),quote.id);assert.equal(revision.version,2);assert.notEqual(revision.quoteNumber,quote.quoteNumber);assert.equal(revision.threadId,quote.threadId);assert.equal((await card(first.id)).stage,'preparing');
  assert.equal((await quotes.readPublicQuote(token)).quoteNumber,quote.quoteNumber);assert.equal((await quotes.readPublicQuote(token)).leadReference,first.reference);
  await db.migratePipelineModule();assert.equal((await quotes.readPublicQuote(token)).quoteNumber,quote.quoteNumber,'existing capability survives migration replay');
  assert.ok((await board({q:quote.quoteNumber})).cards.some(item=>item.id===first.id),'old version search finds same customer');
 });
 await t.test('acceptance auto-updates pipeline and cannot be overwritten by dragging',async()=>{
  const q=await quotes.createQuote((await create()).id,input(),actor,randomUUID());await quotes.sendQuote(q.id,1,randomUUID(),actor);const url=await quotes.copyQuoteLink(q.id,actor);
  await quotes.actOnPublicQuote(url.url.split('/').pop(),'accept');assert.equal((await card(q.leadId)).stage,'accepted');await assert.rejects(move(q.leadId,'lost',{reason:'Fiyat'}),status(409));assert.ok((await board({accepted:'yes'})).total>0);
 });
 await t.test('templates and timeline show new human references; no send invoked',async()=>{
  const email=renderQuoteEmail(quote,'https://www.asirsolar.com/teklif/test','https://www.asirsolar.com');assert.ok(email.subject.includes('ASR-TKLF-1'));assert.ok(email.html.includes('ASR-TLP-1'));
  assert.ok(renderNotificationEmail('team',first,'https://www.asirsolar.com').subject.includes('ASR-TLP-1'));
  const events=(await leads.getLead(first.id)).events;assert.ok(events.some(item=>item.content.includes('ASR-TKLF-1')));assert.ok(!events.some(item=>/ASR-TKF-\d{6}/.test(item.content)));
 });
 await t.test('expired offers show expired badge and leave automatic sent column without a maintenance write',async()=>{
  const lead=await create();const expired=await quotes.createQuote(lead.id,input(),actor,randomUUID());
  await db.getDatabase().prepare("UPDATE asir_crm.quotes SET valid_until='2000-01-01',status='sent',sent_at=? WHERE id=?").run(new Date().toISOString(),expired.id);
  const result=await board({q:lead.reference});assert.equal(result.cards[0].stage,'reviewing');assert.equal(result.cards[0].quoteStatus,'expired');assert.equal(result.summary.amounts.TRY,0);
  assert.equal((await quotes.quoteRecord(expired.id)).status,'sent','pipeline GET does not mutate quote lifecycle');
  await assert.rejects(board({sort:'toString'}),status(400));
 });
});
