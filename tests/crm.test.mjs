import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import nodemailer from 'nodemailer';
// Never use deployment credentials or send real mail from this suite.
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
process.env.CRM_LOCAL_PATH = 'memory://';
process.env.CRM_LOCAL_DATABASE = 'true';
const auth = await import('../lib/crm/auth.ts');
const db = await import('../lib/crm/database.ts');
const repo = await import('../lib/crm/repository.ts');
const validation = await import('../lib/crm/validation.ts');
const email = await import('../lib/crm/email.ts');
const notifications = await import('../lib/crm/notifications.ts');
const types = await import('../lib/crm/types.ts');
const validEnquiry = { name:'Test Müşteri', phone:'05321234567', email:'customer@example.invalid', company:'Test Firma', projectType:'Çatı Tipi', message:'Çatımız için proje değerlendirmesi istiyoruz.', consent:true };
const input = (changes={}) => validation.parseLeadInput({ ...validEnquiry, source:'phone', stage:'new', priority:'normal', assigneeId:'onur', nextFollowUp:'', quoteAmount:'', rejectionReason:'', ...changes });
const status = code => error => error instanceof validation.CrmError && error.status === code;

test('CRM PostgreSQL persistence, authentication and workflow', async t => {
  t.after(async () => { mock.restoreAll(); await db.closeDatabase(); });
  await db.initializeDatabase();
  const onur = await auth.provisionAdmin(auth.adminAccounts[0].email, 'A-long-test-password-2026');
  const furkan = await auth.provisionAdmin(auth.adminAccounts[1].email, 'Another-test-password-2026');

  await t.test('only invited accounts; salted passwords; expired and revoked sessions', async () => {
    await assert.rejects(auth.provisionAdmin('outsider@example.invalid','Valid-test-password'), status(400));
    await assert.rejects(auth.provisionAdmin(onur.email,'Valid-test-password'), status(409));
    assert.notEqual(await auth.hashPassword('Same-test-password'), await auth.hashPassword('Same-test-password'));
    assert.equal((await auth.authenticate(onur.email.toUpperCase(),'A-long-test-password-2026')).id, onur.id);
    assert.equal(await auth.authenticate(onur.email,'wrong'), null);
    assert.equal(await auth.authenticate('missing@example.invalid','wrong'), null);
    assert.equal(await auth.findSession('invalid'), null);
    const token = await auth.createSession(onur.id);
    assert.equal((await auth.findSession(token)).id,onur.id);
    await auth.revokeSession(token); assert.equal(await auth.findSession(token),null);
    const expired = await auth.createSession(onur.id);
    await db.getDatabase().prepare('UPDATE sessions SET expires_at=? WHERE token_hash=?').run(Date.now()-1,auth.tokenHash(expired));
    assert.equal(await auth.findSession(expired),null);
    const old = await auth.createSession(onur.id);
    const changed = await auth.changePassword(onur,'A-long-test-password-2026','Changed-test-password-2026');
    assert.equal(await auth.findSession(old),null);
    assert.equal((await auth.findSession(changed)).id,onur.id);
  });

  await t.test('validation rejects malformed data, honeypots and missing consent', () => {
    for (const change of [{consent:false},{website:'spam'},{name:[]},{email:'bad'},{phone:'abc05321234567'},{projectType:'invalid'},{message:'short'}]) assert.throws(()=>validation.parsePublicEnquiry({...validEnquiry,...change}),status(400));
    for (const change of [{phone:'',email:''},{stage:'lost',rejectionReason:''},{nextFollowUp:'2026-02-30'},{quoteAmount:'-1'},{quoteAmount:'10.001'},{assigneeId:3}]) assert.throws(()=>input(change),status(400));
    assert.equal(input({quoteAmount:'150000.05'}).quoteCents,15000005);
  });

  let website;
  await t.test('concurrent duplicate requests create one lead, one event and two outbox jobs', async () => {
    const key=randomUUID();
    const results=await Promise.all([repo.createWebsiteLead(validEnquiry,key),repo.createWebsiteLead(validEnquiry,key)]);
    assert.equal(results[0].id,results[1].id);
    assert.equal(results.filter(row=>row.duplicate).length,1);
    website=await repo.getLead(results[0].id);
    assert.equal(website.lead.source,'website'); assert.equal(website.events.length,1); assert.equal(website.deliveries.length,2);
    assert.equal(website.lead.projectType,'Çatı Tipi');
    await assert.rejects(repo.createWebsiteLead({...validEnquiry,message:'Changed project message'},key),status(409));
  });

  let manual;
  await t.test('manual channels, responsibility and atomic rollback', async () => {
    manual=await repo.createManualLead(input({source:'whatsapp'}),onur);
    assert.equal(manual.lead.assigneeName,onur.name); assert.equal(manual.deliveries.length,0);
    await assert.rejects(repo.createManualLead(input({source:'website'}),onur),status(400));
    const before=(await repo.listLeads(new URLSearchParams())).total;
    await assert.rejects(repo.createManualLead(input({assigneeId:'missing'}),onur),status(400));
    // Fail the event FK after inserting the lead: both must roll back.
    await assert.rejects(repo.createManualLead(input(),{...onur,id:'missing'}));
    assert.equal((await repo.listLeads(new URLSearchParams())).total,before);
  });

  await t.test('stage history, rejection reasons, notes and optimistic conflict protection', async () => {
    const changes=input({source:'whatsapp',stage:'proposal',quoteAmount:'150000.05',nextFollowUp:types.todayInTurkey()});
    const results=await Promise.allSettled([repo.updateLead(manual.lead.id,changes,1,onur),repo.updateLead(manual.lead.id,{...changes,stage:'meeting'},1,furkan)]);
    assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
    assert.equal(results.find(result=>result.status==='rejected').reason.status,409);
    manual=await repo.getLead(manual.lead.id);
    assert.equal(manual.lead.version,2);
    assert.match(manual.events[0].content,/→/);
    const noted=await repo.addLeadNote(manual.lead.id,'Fotoğraflar istendi. Cuma aranacak.',furkan);
    assert.equal(noted.events[0].actorName,furkan.name);
    assert.equal(noted.lead.version,2);
    await assert.rejects(repo.updateLead(manual.lead.id,input({source:'email'}),2,onur),status(400));
    manual=await repo.updateLead(manual.lead.id,input({source:'whatsapp',stage:'lost',rejectionReason:'Bütçesini gelecek yıla ayırdı.'}),2,furkan);
    assert.match(manual.events[0].content,/Bütçesini/);
  });

  await t.test('archive and restore, filter totals, follow-up and literal search', async () => {
    manual=await repo.archiveLead(manual.lead.id,true,manual.lead.version,onur);
    assert.equal((await repo.listLeads(new URLSearchParams('archived=true'))).total,1);
    await assert.rejects(repo.updateLead(manual.lead.id,input({source:'whatsapp'}),manual.lead.version,onur),status(400));
    manual=await repo.archiveLead(manual.lead.id,false,manual.lead.version,onur);
    const due=await repo.createManualLead(input({name:'100% SOLAR',stage:'won',quoteAmount:'9000.01',nextFollowUp:types.todayInTurkey()}),onur);
    const dashboard=await repo.listLeads(new URLSearchParams('followUp=due&assignee=onur'));
    assert.equal(dashboard.leads[0].id,due.lead.id); assert.equal(dashboard.summary.wonQuoteCents,900001);
    assert.equal((await repo.listLeads(new URLSearchParams('q=100%25'))).total,1);
    assert.equal((await repo.listLeads(new URLSearchParams({q:"' OR 1=1 --"}))).total,0);
    assert.equal((await repo.listLeads(new URLSearchParams('page=-9'))).page,1);
  });

  await t.test('persistent rate limits remain atomic under concurrency', async () => {
    const results=await Promise.all(Array.from({length:6},()=>auth.consumeLimit('limited-test',3,60)));
    assert.equal(results.filter(Boolean).length,3);
    await db.getDatabase().prepare('UPDATE request_limits SET expires_at=?').run(Date.now()-1);
    assert.equal(await auth.consumeLimit('limited-test',3,60),true);
  });

  await t.test('SMTP outage preserves lead; concurrent retries do not resend sent jobs', async () => {
    delete process.env.CRM_SMTP_HOST;
    assert.equal((await email.flushEmailOutbox()).configured,false);
    Object.assign(process.env,{CRM_EMAIL_ENABLED:'true',CRM_SMTP_HOST:'smtp.example.invalid',CRM_SMTP_USER:'test',CRM_SMTP_PASSWORD:'test-only',CRM_EMAIL_FROM:'test@example.invalid',APP_ORIGIN:'https://example.invalid'});
    const sent=[]; let failing=true;
    mock.method(nodemailer,'createTransport',()=>({close(){},async sendMail(message){if(failing)throw Object.assign(new Error('offline'),{code:'ECONNECTION'});sent.push(message);return {accepted:[message.to],rejected:[]};}}));
    for(const delivery of website.deliveries) await notifications.retryNotification(website.lead.id,'email',delivery.id,onur.id);
    await email.flushEmailOutbox(website.lead.id);
    assert.equal((await repo.getLead(website.lead.id)).deliveries.filter(row=>row.status==='failed').length,2);
    failing=false;
    await Promise.all([email.flushEmailOutbox(website.lead.id,true),email.flushEmailOutbox(website.lead.id,true)]);
    assert.equal(sent.length,2);
    assert.ok(sent.every(message=>auth.adminAccounts.some(account=>account.email===message.to)));
    await email.flushEmailOutbox(website.lead.id,true); assert.equal(sent.length,2);
    assert.equal((await repo.getLead(website.lead.id)).deliveries.filter(row=>row.status==='sent').length,2);
    mock.restoreAll();
  });

  await t.test('anonymous database roles cannot read the private CRM schema', async () => {
    await db.getDatabase().prepare('CREATE ROLE crm_test_anon').run();
    for (const table of ['leads','email_outbox','sms_outbox','notification_worker']) {
      await assert.rejects(db.transaction(async connection=>{
        await connection.prepare('SET LOCAL ROLE crm_test_anon').run();
        await connection.prepare(`SELECT * FROM ${table}`).all();
      }),error=>error.code==='42501');
    }
  });

  await t.test('schema owner can initialize and repeat migrations without database CREATE', async () => {
    const restricted = new PGlite();
    try {
      await restricted.exec('CREATE ROLE crm_schema_owner; CREATE SCHEMA asir_crm AUTHORIZATION crm_schema_owner; SET ROLE crm_schema_owner;');
      const permissions = await restricted.query("SELECT has_database_privilege(current_user, current_database(), 'CREATE') AS can_create");
      assert.equal(permissions.rows[0].can_create, false);
      const migration = await readFile(db.migrationPath, 'utf8');
      await restricted.exec(migration);
      await restricted.exec(migration);
      const notificationsMigration = await readFile(db.notificationMigrationPath, 'utf8');
      await restricted.exec(notificationsMigration);
      await restricted.exec(notificationsMigration);
      const tables = await restricted.query("SELECT count(*)::integer AS total FROM pg_tables WHERE schemaname='asir_crm'");
      assert.equal(tables.rows[0].total, 9);
    } finally { await restricted.close(); }
  });
});
