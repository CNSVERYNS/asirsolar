import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

// No deployment environment is loaded. All provider requests are intercepted below.
Object.assign(process.env, { DATABASE_URL:'', VERCEL:'', CRM_LOCAL_DATABASE:'true', CRM_LOCAL_PATH:'memory://', APP_ORIGIN:'https://www.asirsolar.com', CRM_EMAIL_PROVIDER:'zeptomail', CRM_EMAIL_ENABLED:'false', CRM_SMS_ENABLED:'false', CRM_QUOTES_SEND_ENABLED:'false', CRM_ZEPTOMAIL_TOKEN:'test-token-only', CRM_EMAIL_FROM:'ASIR SOLAR GÜNEŞ ENERJİSİ SİSTEMLERİ <iletisim@asirsolar.com>', CRM_EMAIL_REPLY_TO:'iletisim@asirsolar.com', CRM_NETGSM_USERCODE:'', CRM_NETGSM_PASSWORD:'', CRM_NETGSM_HEADER:'' });
const db = await import('../lib/crm/database.ts');
const auth = await import('../lib/crm/auth.ts');
const leads = await import('../lib/crm/repository.ts');
const quotes = await import('../lib/quotes/repository.ts');
const files = await import('../lib/quotes/attachments.ts');
const validation = await import('../lib/quotes/validation.ts');
const types = await import('../lib/quotes/types.ts');
const { parseLeadInput } = await import('../lib/crm/validation.ts');
const { flushEmailOutbox } = await import('../lib/crm/email.ts');
const { flushSmsOutbox } = await import('../lib/crm/sms.ts');
const { retryNotification } = await import('../lib/crm/notifications.ts');
const { renderQuoteEmail, renderQuoteSms } = await import('../lib/quotes/templates.ts');
const { quoteJobAllowed } = await import('../lib/quotes/notifications.ts');
const input = (change={}) => validation.parseQuote({title:'Çatı GES Teklifi',message:types.defaultQuoteMessage('Ahmet Yılmaz','Çatı GES'),amount:'420000.05',currency:'TRY',vatMode:'included',validUntil:types.defaultQuoteDate(),emailRequested:true,smsRequested:true,...change});
const status = code => error => error.status === code;
let actor;
const newLead = async (changes={}) => (await leads.createManualLead(parseLeadInput({name:'Ahmet Yılmaz',email:'customer@example.invalid',phone:'05321234567',projectType:'Çatı Tipi',source:'phone',stage:'new',priority:'normal',message:'',company:'',assigneeId:'',nextFollowUp:'',quoteAmount:'',rejectionReason:'',...changes}),actor)).lead;
const create = async (changes={}) => { const lead = await newLead(); return quotes.createQuote(lead.id,input(changes),actor,randomUUID()); };
const issue = async quote => { process.env.CRM_QUOTES_SEND_ENABLED='true'; return quotes.sendQuote(quote.id,quote.editVersion,randomUUID(),actor); };
const tokenOf = async quote => new URL((await quotes.copyQuoteLink(quote.id,actor)).url).pathname.split('/').pop();

test('quote lifecycle, immutable revisions, secure files and shared delivery workers', async t => {
  const calls=[]; let provider = () => new Response(JSON.stringify({data:[{code:'EM_104'}],request_id:'mock-request'}));
  mock.method(globalThis,'fetch',async (url,options) => { calls.push({url:String(url),options,body:JSON.parse(options.body)}); return provider(url,options); });
  t.after(async()=>{mock.restoreAll();await db.closeDatabase();});
  actor=await auth.provisionAdmin(auth.adminAccounts[0].email,'Quote-test-only-password-2026');
  await t.test('validation: amount, currency, VAT, dates, headers and actions',()=>{
    assert.equal(input().amountCents,42000005);
    for(const change of [{amount:'0'},{amount:'-1'},{amount:'1.001'},{amount:'1e7'},{amount:'10000000000'},{currency:'BTC'},{vatMode:'none'},{validUntil:'2026-02-30'},{validUntil:'2000-01-01'},{title:'Offer\r\nBcc:evil@example.invalid'},{message:'x\0'},{emailRequested:'true'}])assert.throws(()=>input(change),status(400));
    assert.throws(()=>validation.requestKey('123'),status(400));
    assert.throws(()=>validation.customerRevision('x'),status(400));
    assert.equal(validation.normalizedSmsPhone('+90 (532) 123 45 67'),'+905321234567');
    assert.throws(()=>validation.normalizedSmsPhone('123'),status(400));
  });
  await t.test('draft persistence, default-off sending and duplicate creation',async()=>{
    const lead=await newLead(), key=randomUUID();
    const results=await Promise.all([quotes.createQuote(lead.id,input(),actor,key),quotes.createQuote(lead.id,input(),actor,key)]);
    assert.equal(results[0].id,results[1].id);assert.equal(results[0].status,'draft');
    assert.equal(results[0].customerEmail,lead.email);assert.match(results[0].quoteNumber,/^ASR-TKLF-[1-9]\d*$/);
    assert.equal((await quotes.getQuoteDetail(results[0].id)).deliveries.length,0);
    await assert.rejects(quotes.sendQuote(results[0].id,1,randomUUID(),actor),status(503));
    await assert.rejects(quotes.copyQuoteLink(results[0].id,actor),status(409));
    await assert.rejects(quotes.createQuote(lead.id,input({amount:'1'}),actor,key),status(409));
  });
  await t.test('concurrent creations get unique immutable numbers; stale drafts reject writes',async()=>{
    const lead=await newLead();
    const results=await Promise.all(Array.from({length:6},()=>quotes.createQuote(lead.id,input(),actor,randomUUID())));
    assert.equal(new Set(results.map(row=>row.quoteNumber)).size,6);
    const quote=results[0];const updated=await quotes.updateQuote(quote.id,input({amount:'150000.99'}),1,actor);
    assert.equal(updated.editVersion,2);assert.equal(updated.amountCents,15000099);
    await assert.rejects(quotes.updateQuote(quote.id,input(),1,actor),status(409));
    await assert.rejects(db.getDatabase().prepare('UPDATE asir_crm.quote_threads SET quote_number=? WHERE id=?').run('changed',quote.threadId));
  });
  await t.test('missing email and malformed phone cannot send, lead remains',async()=>{
    process.env.CRM_QUOTES_SEND_ENABLED='true';
    const lead=await newLead({email:''});const quote=await quotes.createQuote(lead.id,input(),actor,randomUUID());
    await assert.rejects(issue(quote),status(400));assert.equal((await quotes.quoteRecord(quote.id)).status,'draft');
    assert.ok(await leads.getLead(lead.id));
    const noChannels=await create({emailRequested:false,smsRequested:false});await assert.rejects(issue(noChannels),status(400));
  });
  await t.test('send is atomic and idempotent; missing providers hold both jobs',async()=>{
    const quote=await create(), key=randomUUID();
    const results=await Promise.all([quotes.sendQuote(quote.id,1,key,actor),quotes.sendQuote(quote.id,1,key,actor),quotes.sendQuote(quote.id,1,randomUUID(),actor)]);
    assert.equal(results.filter(row=>!row.duplicate).length,1);
    const detail=await quotes.getQuoteDetail(quote.id);assert.equal(detail.deliveries.length,2);assert.ok(detail.deliveries.every(row=>row.status==='held'));
    assert.equal((await leads.getLead(quote.leadId)).lead.stage,'proposal');
    assert.equal((await flushSmsOutbox(quote.leadId)).configured,false);
    await assert.rejects(quotes.updateQuote(quote.id,input(),1,actor),status(409));
    await assert.rejects(db.getDatabase().prepare('UPDATE asir_crm.quotes SET amount_cents=100 WHERE id=?').run(quote.id));
    await assert.rejects(db.getDatabase().prepare("UPDATE asir_crm.quotes SET status='draft' WHERE id=?").run(quote.id));
  });
  await t.test('queue insertion failure rolls back publication, token, dispatch and CRM stage',async()=>{
    const quote=await create();
    await db.getDatabase().prepare("CREATE FUNCTION asir_crm.quote_test_queue_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.quote_id IS NOT NULL THEN RAISE EXCEPTION 'test_queue_failure'; END IF; RETURN NEW; END $$").run();
    await db.getDatabase().prepare('CREATE TRIGGER quote_test_queue_failure BEFORE INSERT ON asir_crm.sms_outbox FOR EACH ROW EXECUTE FUNCTION asir_crm.quote_test_queue_failure()').run();
    try {
      await assert.rejects(issue(quote));
      const detail=await quotes.getQuoteDetail(quote.id);assert.equal(detail.quote.status,'draft');assert.equal(detail.deliveries.length,0);
      assert.equal((await leads.getLead(quote.leadId)).lead.stage,'new');
      for(const table of ['quote_tokens','quote_dispatches'])assert.equal((await db.getDatabase().prepare(`SELECT count(*) AS total FROM asir_crm.${table} WHERE quote_id=?`).get(quote.id)).total,0);
    } finally {await db.getDatabase().prepare('DROP TRIGGER quote_test_queue_failure ON asir_crm.sms_outbox').run();await db.getDatabase().prepare('DROP FUNCTION asir_crm.quote_test_queue_failure()').run();}
  });
  await t.test('hash-only access table, 256-bit tokens, public DTO isolation, first/repeated views',async()=>{
    const quote=await create();await issue(quote);const token=await tokenOf(quote), second=await tokenOf(quote);
    assert.match(token,/^[A-Za-z0-9_-]{43}$/);assert.notEqual(token,second);
    const hashes=await db.getDatabase().prepare('SELECT token_hash FROM asir_crm.quote_tokens WHERE quote_id=?').all(quote.id);
    assert.ok(hashes.every(row=>row.token_hash!==token&&row.token_hash.length===64));
    const publicQuote=await quotes.readPublicQuote(token);assert.equal(publicQuote.status,'sent');
    for(const key of ['id','leadId','threadId','customerEmail','customerPhone','creationKey','publicToken','emailRequested','smsRequested'])assert.ok(!(key in publicQuote));
    assert.ok(!JSON.stringify(publicQuote).includes(quote.id)&&!JSON.stringify(publicQuote).includes(quote.leadId));
    await assert.rejects(quotes.readPublicQuote('invalid'),status(404));await assert.rejects(quotes.readPublicQuote('a'.repeat(43)),status(404));
    const viewed=await quotes.viewPublicQuote(token);assert.equal(viewed.status,'viewed');assert.ok(viewed.firstViewedAt);
    await quotes.viewPublicQuote(token);await quotes.viewPublicQuote(second);
    const detail=await quotes.getQuoteDetail(quote.id);assert.equal(detail.events.filter(e=>e.kind==='quote_viewed').length,1);assert.equal(detail.quote.firstViewedAt,viewed.firstViewedAt);assert.ok(detail.quote.lastViewedAt>=viewed.firstViewedAt);
    assert.equal(detail.deliveries.length,2,'no view-notification spam');
  });
  await t.test('accept once, notify both engineers separately, CRM mapping',async()=>{
    const quote=await create();await issue(quote);const token=await tokenOf(quote);
    const accepted=await quotes.actOnPublicQuote(token,'accept');assert.equal(accepted.quote.status,'accepted');assert.ok(accepted.quote.acceptedAt);
    assert.equal((await quotes.actOnPublicQuote(token,'accept')).duplicate,true);
    await assert.rejects(quotes.actOnPublicQuote(token,'revision','Change price'),status(409));
    const detail=await quotes.getQuoteDetail(quote.id);const internal=detail.deliveries.filter(row=>row.purpose==='quote_accepted');
    assert.deepEqual(internal.map(row=>row.recipient).sort(),['furkan.cansever@asirsolar.com','onur.durak@asirsolar.com']);
    assert.equal(detail.events.filter(row=>row.kind==='quote_accepted').length,1);assert.equal((await leads.getLead(quote.leadId)).lead.stage,'won');
    await assert.rejects(quotes.createQuote(quote.leadId,input(),actor,randomUUID(),quote.id),status(409));
  });
  await t.test('revision records customer message; V2 preserves V1 and revokes old links on send',async()=>{
    const first=await create();await issue(first);const token=await tokenOf(first);
    const response=await quotes.actOnPublicQuote(token,'revision','Batarya kapasitesini artırabilir miyiz?');
    assert.equal(response.quote.status,'revision_requested');assert.equal((await quotes.actOnPublicQuote(token,'revision',response.quote.revisionMessage)).duplicate,true);
    const second=await quotes.createQuote(first.leadId,input({amount:'500000'}),actor,randomUUID(),first.id);
    assert.equal(second.version,2);assert.notEqual(second.quoteNumber,first.quoteNumber);assert.equal(second.threadId,first.threadId);
    assert.equal((await quotes.readPublicQuote(token)).status,'revision_requested','old version stays readable during drafting');
    await issue(second);await assert.rejects(quotes.readPublicQuote(token),status(404));
    const old=await quotes.quoteRecord(first.id);assert.equal(old.status,'revoked');assert.equal(old.amountCents,first.amountCents);assert.equal(old.revisionMessage,response.quote.revisionMessage);
    const newToken=await tokenOf(second);await quotes.revokeQuote(second.id,actor);await assert.rejects(quotes.readPublicQuote(newToken),status(404));await assert.rejects(quotes.actOnPublicQuote(newToken,'accept'),status(404));
  });
  await t.test('expiry blocks customer response, downloads and delivery',async()=>{
    const quote=await create();await db.getDatabase().prepare("UPDATE asir_crm.quotes SET valid_until='2000-01-01' WHERE id=?").run(quote.id);
    await assert.rejects(issue(await quotes.quoteRecord(quote.id)),status(409));
    // Simulate passage of time via a draft with an old date, then issue state in the DB before immutability applies.
    await db.getDatabase().prepare("UPDATE asir_crm.quotes SET status='sent',sent_at=? WHERE id=?").run(new Date().toISOString(),quote.id);
    const token=await db.transaction(()=>quotes.issueQuoteToken(quote.id));
    const expired=await quotes.readPublicQuote(token);assert.equal(expired.status,'expired');assert.ok(expired.expiredAt);
    await assert.rejects(quotes.actOnPublicQuote(token,'accept'),status(409));assert.equal(await quoteJobAllowed(quote.id,true),false);
    await assert.rejects(quotes.publicAttachment(token,randomUUID()),status(404));
  });
  await t.test('files validate MIME/signature/size; no sent mutation or cross-quote download',async()=>{
    const quote=await create();const png=await sharp({create:{width:16,height:16,channels:3,background:'#173f35'}}).png().toBuffer();
    const pdf=Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
    for(const [data,mime] of [[Buffer.from('<script>bad</script>'),'application/pdf'],[png,'image/jpeg'],[png,'text/html'],[Buffer.alloc(3*1024*1024+1),'application/pdf'],[Buffer.from('%PDF-1.4\n/JavaScript (bad)\n%%EOF'),'application/pdf']])await assert.rejects(files.validateQuoteFile(data,mime,'bad.pdf'));
    const withPdf=await files.addQuoteAttachment(quote.id,pdf,'application/pdf','../../evil\r\n.pdf',1,actor);
    assert.equal(withPdf.attachments.length,1);assert.equal(withPdf.attachments[0].filename,'evil.pdf');
    const duplicate=await files.addQuoteAttachment(quote.id,pdf,'application/pdf','another.pdf',withPdf.editVersion,actor);assert.equal(duplicate.attachments.length,1);
    const withImage=await files.addQuoteAttachment(quote.id,png,'image/png','logo.png',withPdf.editVersion,actor);await issue(withImage);
    await assert.rejects(files.addQuoteAttachment(quote.id,png,'image/png','logo.png',withImage.editVersion,actor),status(409));
    await assert.rejects(db.getDatabase().prepare('DELETE FROM asir_crm.quote_attachments WHERE quote_id=?').run(quote.id));
    const token=await tokenOf(quote), other=await create();await issue(other);const otherToken=await tokenOf(other);
    const fileId=withPdf.attachments[0].id;assert.equal((await quotes.publicAttachment(token,fileId)).mimeType,'application/pdf');
    await assert.rejects(quotes.publicAttachment(otherToken,fileId),status(404));await assert.rejects(quotes.attachmentRecord(other.id,fileId),status(404));
    const revision=await quotes.createQuote(quote.leadId,input(),actor,randomUUID(),quote.id);assert.equal(revision.attachments.length,2);assert.notEqual(revision.attachments[0].id,withImage.attachments[0].id);
  });
  await t.test('email summary and SMS use HTTPS public link; escaping, plain text, branded sender and Reply-To',async()=>{
    process.env.CRM_EMAIL_ENABLED='true';const quote=await create({message:'Hello <img src=x onerror=alert(1)>\nTürkçe: ğışçöü'});await issue(quote);
    calls.length=0;await flushEmailOutbox(quote.leadId);assert.equal(calls.length,1);
    const payload=calls[0].body;assert.equal(payload.from.address,'iletisim@asirsolar.com');assert.equal(payload.from.name,'ASIR SOLAR GÜNEŞ ENERJİSİ SİSTEMLERİ');assert.equal(payload.reply_to[0].address,'iletisim@asirsolar.com');assert.equal(payload.to[0].email_address.address,quote.customerEmail);
    assert.match(payload.htmlbody,/https:\/\/www\.asirsolar\.com\/teklif\/[A-Za-z0-9_-]{43}/);assert.ok(payload.htmlbody.includes('/images/brand/asir-logo.jpeg'));assert.ok(payload.htmlbody.includes('&lt;img'));assert.ok(!payload.htmlbody.includes('<img src=x'));assert.ok(payload.textbody.includes(quote.quoteNumber));assert.ok(!payload.textbody.includes('/admin/'));
    const stored=await db.getDatabase().prepare('SELECT quote_token FROM email_outbox WHERE quote_id=?').get(quote.id);assert.equal(stored.quote_token,null,'clear bearer payload after delivery');
    const detail=await quotes.getQuoteDetail(quote.id);assert.equal(detail.events.filter(e=>e.kind==='quote_email_accepted_by_provider').length,1);
    const url=(await quotes.copyQuoteLink(quote.id,actor)).url;assert.ok(renderQuoteSms(quote,url).startsWith('ASIR SOLAR ASR-TKLF-'));assert.throws(()=>renderQuoteSms(quote,'http://localhost/teklif/x'));
    const template=renderQuoteEmail({...quote,customerName:'<script>x</script>'},url,'https://www.asirsolar.com');assert.ok(template.html.includes('&lt;script&gt;'));assert.ok(!template.html.includes('<script>'));
  });
  await t.test('parallel quote workers accept one email; USD does not overwrite the TRY CRM amount',async()=>{
    const quote=await create({currency:'USD',amount:'15000',smsRequested:false});await issue(quote);calls.length=0;
    await Promise.all([flushEmailOutbox(quote.leadId),flushEmailOutbox(quote.leadId)]);assert.equal(calls.length,1);
    assert.equal((await quotes.getQuoteDetail(quote.id)).events.filter(e=>e.kind==='quote_email_accepted_by_provider').length,1);
    await quotes.actOnPublicQuote(await tokenOf(quote),'accept');assert.equal((await leads.getLead(quote.leadId)).lead.quoteCents,null);
  });
  await t.test('email rejection and ambiguous timeout preserve quote; disabled SMS never fails it',async()=>{
    const quote=await create();await issue(quote);provider=()=>new Response('do not persist this body or credentials',{status:401});
    await flushEmailOutbox(quote.leadId);let detail=await quotes.getQuoteDetail(quote.id);assert.equal(detail.quote.status,'sent');assert.equal(detail.deliveries.find(row=>row.channel==='email').status,'failed');assert.equal(detail.deliveries.find(row=>row.channel==='sms').status,'held');
    assert.ok(!JSON.stringify(detail).includes('credentials'));assert.ok(await leads.getLead(quote.leadId));
    const email=detail.deliveries.find(row=>row.channel==='email');await retryNotification(quote.leadId,'email',email.id,actor.id);
    provider=()=>{throw new Error('connection timed out secret');};await flushEmailOutbox(quote.leadId);detail=await quotes.getQuoteDetail(quote.id);assert.equal(detail.deliveries.find(row=>row.channel==='email').status,'unknown');
    await assert.rejects(retryNotification(quote.leadId,'email',email.id,actor.id),status(409));await assert.rejects(quotes.sendQuote(quote.id,1,randomUUID(),actor,true),status(409));
    const before=calls.length;await flushEmailOutbox(quote.leadId);assert.equal(calls.length,before,'unknown never auto-retries');
    provider=()=>new Response(JSON.stringify({data:[{code:'EM_104'}],request_id:'mock-request'}));
  });
  await t.test('quote flag protects queued jobs and manual retries; original lead email still works',async()=>{
    const quote=await create();await issue(quote);process.env.CRM_QUOTES_SEND_ENABLED='false';calls.length=0;
    await flushEmailOutbox(quote.leadId);assert.equal(calls.length,0);
    assert.equal(await quoteJobAllowed(quote.id,true),false);
    const form=await leads.createWebsiteLead({name:'Form Test',phone:'05321234567',email:'form@example.invalid',company:'',projectType:'Çatı Tipi',message:'Teklif testinden bağımsız form.',consent:true},randomUUID());
    await flushEmailOutbox(form.id);assert.equal(calls.length,3,'existing forms retain their own channel flag');
    process.env.CRM_QUOTES_SEND_ENABLED='true';
  });
  await t.test('SMS provider failure preserves quote and email; acceptance is audited',async()=>{
    Object.assign(process.env,{CRM_SMS_ENABLED:'true',CRM_SMS_PROVIDER:'netgsm',CRM_NETGSM_USERCODE:'test-only',CRM_NETGSM_PASSWORD:'test-only',CRM_NETGSM_HEADER:'TEST'});
    const quote=await create();await issue(quote);provider=(url)=>String(url).includes('netgsm')?new Response(JSON.stringify({code:'30'})):new Response(JSON.stringify({data:[{code:'EM_104'}],request_id:'mock'}));
    await flushEmailOutbox(quote.leadId);await flushSmsOutbox(quote.leadId);let detail=await quotes.getQuoteDetail(quote.id);assert.equal(detail.quote.status,'sent');assert.equal(detail.deliveries.find(row=>row.channel==='email').status,'sent');assert.equal(detail.deliveries.find(row=>row.channel==='sms').status,'failed');
    const sms=detail.deliveries.find(row=>row.channel==='sms');await retryNotification(quote.leadId,'sms',sms.id,actor.id);
    provider=()=>new Response(JSON.stringify({code:'00',jobid:'12345678'}));await flushSmsOutbox(quote.leadId);detail=await quotes.getQuoteDetail(quote.id);assert.equal(detail.deliveries.find(row=>row.channel==='sms').status,'accepted');assert.equal(detail.events.filter(e=>e.kind==='quote_sms_accepted_by_provider').length,1);
    process.env.CRM_SMS_ENABLED='false';
  });
  await t.test('private schema rejects anonymous access; migration contains no destructive table operations',async()=>{
    await db.getDatabase().prepare('CREATE ROLE quote_test_anon').run();
    for(const table of ['quotes','quote_threads','quote_tokens','quote_attachments','quote_events','quote_dispatches'])await assert.rejects(db.transaction(async tx=>{await tx.prepare('SET LOCAL ROLE quote_test_anon').run();await tx.prepare(`SELECT * FROM asir_crm.${table}`).all();}),error=>error.code==='42501');
    const before=(await db.getDatabase().prepare('SELECT count(*) AS total FROM asir_crm.quotes').get()).total;
    // Restricted-role execution/re-execution is covered by crm.test.mjs.
    const sql=await readFile('supabase/migrations/202609170001_quotes.sql','utf8');
    assert.ok(!/DROP TABLE|TRUNCATE/i.test(sql));assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'));
    assert.equal((await db.getDatabase().prepare('SELECT count(*) AS total FROM asir_crm.quotes').get()).total,before);
  });
});
