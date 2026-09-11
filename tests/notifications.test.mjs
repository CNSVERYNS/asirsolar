import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
Object.assign(process.env, { CRM_LOCAL_PATH:'memory://',CRM_LOCAL_DATABASE:'true',CRM_EMAIL_ENABLED:'false',CRM_SMS_ENABLED:'false',APP_ORIGIN:'https://example.invalid' });
const db = await import('../lib/crm/database.ts');
const auth = await import('../lib/crm/auth.ts');
const repo = await import('../lib/crm/repository.ts');
const {processNotifications,retryNotification} = await import('../lib/crm/notifications.ts');
const {flushEmailOutbox} = await import('../lib/crm/email.ts');
const {flushSmsOutbox,refreshSmsReports} = await import('../lib/crm/sms.ts');
const {sendNetgsmSms} = await import('../lib/crm/netgsm.ts');
const enquiry = {name:'Notification Test',phone:'05000000000',email:'customer@example.invalid',company:'Test',projectType:'Çatı Tipi',message:'Notification test only, never sent externally.',consent:true};
const smsAccepted = jobid => new Response(JSON.stringify({code:'00',jobid}),{status:200});
const active = () => Object.assign(process.env,{CRM_EMAIL_ENABLED:'true',CRM_SMS_ENABLED:'true',CRM_SMS_PROVIDER:'netgsm',CRM_NETGSM_USERCODE:'test',CRM_NETGSM_PASSWORD:'test-only',CRM_NETGSM_HEADER:'TEST',CRM_SMTP_HOST:'smtp.example.invalid',CRM_SMTP_USER:'test',CRM_SMTP_PASSWORD:'test-only',CRM_EMAIL_FROM:'test@example.invalid'});
async function create() { return repo.getLead((await repo.createWebsiteLead(enquiry,randomUUID())).id); }

test('four-channel notification persistence, delivery and recovery', async t => {
  await db.initializeDatabase();
  await auth.provisionAdmin('onur.durak@asirsolar.com','Only-test-password-2026');
  await auth.provisionAdmin('furkan.cansever@asirsolar.com','Only-test-password-2027');
  t.after(async()=>{mock.restoreAll();await db.closeDatabase();});
  let held;
  await t.test('duplicate form stores one lead and exactly four held jobs', async()=>{
    const key=randomUUID(); const results=await Promise.all([repo.createWebsiteLead(enquiry,key),repo.createWebsiteLead(enquiry,key)]);
    assert.equal(results[0].id,results[1].id); held=await repo.getLead(results[0].id);
    assert.equal(held.deliveries.length,2); assert.equal(held.smsDeliveries.length,2);
    assert.ok([...held.deliveries,...held.smsDeliveries].every(row=>row.status==='held'));
    assert.deepEqual(held.smsDeliveries.map(row=>row.recipient).sort(),['+905419243545','+905431185861']);
  });
  await t.test('provider activation cannot automatically send old held requests',async()=>{
    active();let calls=0;
    mock.method(nodemailer,'createTransport',()=>{calls++;throw Error('must not send');});
    mock.method(globalThis,'fetch',async()=>{calls++;throw Error('must not send');});
    await processNotifications(held.lead.id);assert.equal(calls,0);
    mock.restoreAll();
  });
  await t.test('failure saving an SMS rolls back the lead, event and both email jobs',async()=>{
    const before=await db.getDatabase().prepare('SELECT count(*) AS total FROM leads').get();
    await db.getDatabase().prepare("CREATE FUNCTION asir_crm.test_sms_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test rollback'; END $$;").run();
    await db.getDatabase().prepare('CREATE TRIGGER test_sms_failure BEFORE INSERT ON asir_crm.sms_outbox FOR EACH ROW EXECUTE FUNCTION asir_crm.test_sms_failure();').run();
    try {await assert.rejects(create(),/test rollback/);} finally {
      await db.getDatabase().prepare('DROP TRIGGER test_sms_failure ON asir_crm.sms_outbox;').run();
      await db.getDatabase().prepare('DROP FUNCTION asir_crm.test_sms_failure();').run();
    }
    assert.deepEqual(await db.getDatabase().prepare('SELECT count(*) AS total FROM leads').get(),before);
  });
  await t.test('parallel workers send each recipient once and keep private form text out of SMS',async()=>{
    const item=await create(); const mails=[]; const texts=[];
    mock.method(nodemailer,'createTransport',()=>({close(){},async sendMail(message){mails.push(message);return {accepted:[message.to],rejected:[]};}}));
    mock.method(globalThis,'fetch',async(url,options)=>{assert.equal(url,'https://api.netgsm.com.tr/sms/rest/v2/send');const body=JSON.parse(options.body);texts.push(body);return smsAccepted(String(100+texts.length));});
    await Promise.all([processNotifications(item.lead.id),processNotifications(item.lead.id)]);
    assert.equal(mails.length,2);assert.equal(texts.length,2);
    assert.deepEqual(texts.map(body=>body.messages[0].no).sort(),['5419243545','5431185861']);
    assert.ok(texts.every(body=>!body.messages[0].msg.includes(enquiry.message)&&!body.messages[0].msg.includes(enquiry.email)));
    assert.ok(mails.every(message=>message.text.includes(enquiry.message)&&message.replyTo===enquiry.email));
    const updated=await repo.getLead(item.lead.id);assert.ok(updated.deliveries.every(row=>row.status==='sent'));assert.ok(updated.smsDeliveries.every(row=>row.status==='accepted'));
    await assert.rejects(retryNotification(item.lead.id,'sms',updated.smsDeliveries[0].id,'onur'),error=>error.status===409);
    mock.restoreAll();
  });
  await t.test('one SMTP recipient failure does not prevent the other recipient or SMS',async()=>{
    const item=await create();let sms=0;
    mock.method(nodemailer,'createTransport',()=>({close(){},async sendMail(message){if(message.to.startsWith('onur'))throw Object.assign(Error('connection'),{code:'ECONNECTION'});return {accepted:[message.to],rejected:[]};}}));
    mock.method(globalThis,'fetch',async()=>smsAccepted(String(200+ ++sms)));
    await processNotifications(item.lead.id);
    const updated=await repo.getLead(item.lead.id);assert.deepEqual(updated.deliveries.map(row=>row.status).sort(),['failed','sent']);assert.equal(sms,2);
    assert.ok(updated.deliveries.find(row=>row.status==='failed').retryable);mock.restoreAll();
  });
  await t.test('ambiguous SMS timeout and SMTP DATA timeout never auto resend',async()=>{
    const item=await create();let calls=0;
    mock.method(nodemailer,'createTransport',()=>({close(){},async sendMail(){throw Object.assign(Error('timeout after DATA'),{code:'ETIMEDOUT',command:'DATA'});}}));
    mock.method(globalThis,'fetch',async()=>{calls++;throw Error('timeout');});
    await processNotifications(item.lead.id);await processNotifications(item.lead.id);
    const updated=await repo.getLead(item.lead.id);assert.equal(calls,2);assert.ok([...updated.deliveries,...updated.smsDeliveries].every(row=>row.status==='unknown'&&!row.retryable));
    await assert.rejects(retryNotification(item.lead.id,'sms',updated.smsDeliveries[0].id,'onur'),error=>error.status===409);
    await retryNotification(item.lead.id,'sms',updated.smsDeliveries[0].id,'onur',true);
    assert.equal((await repo.getLead(item.lead.id)).smsDeliveries[0].status,'pending');mock.restoreAll();
  });
  await t.test('delivery reports must match both provider ID and phone; accepted is not delivered',async()=>{
    const item=await create();await db.getDatabase().prepare("UPDATE sms_outbox SET status='accepted',provider_id='777' WHERE id=?").run(item.smsDeliveries[0].id);
    mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({code:'00',jobs:[{jobid:'777',number:'5000000000',status:1},{jobid:'777',number:item.smsDeliveries[0].recipient.slice(-10),status:0}]})));
    await refreshSmsReports();assert.equal((await repo.getLead(item.lead.id)).smsDeliveries[0].status,'accepted');mock.restoreAll();
    await db.getDatabase().prepare('UPDATE sms_outbox SET report_checked_at=0 WHERE id=?').run(item.smsDeliveries[0].id);
    mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({code:'00',jobs:[{jobid:'777',number:item.smsDeliveries[0].recipient.slice(-10),status:1,errorCode:0}]})));
    await refreshSmsReports();assert.equal((await repo.getLead(item.lead.id)).smsDeliveries[0].status,'delivered');mock.restoreAll();
  });
  await t.test('documented throttle is retryable but success without job ID is uncertain',async()=>{
    mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({code:'80'})));
    await assert.rejects(sendNetgsmSms('+905419243545','Test','id'),error=>error.retryable&&!error.uncertain);mock.restoreAll();
    mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({code:'00'})));
    await assert.rejects(sendNetgsmSms('+905419243545','Test','id'),error=>error.uncertain&&!error.retryable);mock.restoreAll();
  });
  await t.test('stale sending claims become unknown instead of being resent',async()=>{
    const item=await create();for(const table of ['email_outbox','sms_outbox'])await db.getDatabase().prepare(`UPDATE ${table} SET status='sending',claimed_at=0 WHERE lead_id=?`).run(item.lead.id);
    await Promise.all([flushEmailOutbox(item.lead.id),flushSmsOutbox(item.lead.id)]);
    const updated=await repo.getLead(item.lead.id);assert.ok([...updated.deliveries,...updated.smsDeliveries].every(row=>row.status==='unknown'));
  });
});
