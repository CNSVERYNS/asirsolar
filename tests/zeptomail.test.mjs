import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';

delete process.env.DATABASE_URL;
delete process.env.VERCEL;
const fakeToken = `test-only-${randomUUID()}`;
const from = 'Asır Solar İletişim <iletisim@asirsolar.com>';
const active = () => Object.assign(process.env, {
  CRM_LOCAL_DATABASE:'true', CRM_LOCAL_PATH:'memory://', APP_ORIGIN:'https://www.asirsolar.com',
  CRM_EMAIL_PROVIDER:'zeptomail', CRM_ZEPTOMAIL_TOKEN:fakeToken, CRM_EMAIL_ENABLED:'true',
  CRM_EMAIL_FROM:from, CRM_EMAIL_REPLY_TO:'iletisim@asirsolar.com',
  CRM_SMTP_HOST:'smtp.example.invalid', CRM_SMTP_USER:'unused', CRM_SMTP_PASSWORD:'unused-test-only',
  CRM_SMS_ENABLED:'false', CRM_SMS_PROVIDER:'netgsm', CRM_NETGSM_USERCODE:'', CRM_NETGSM_PASSWORD:'', CRM_NETGSM_HEADER:'',
});
active();
const db = await import('../lib/crm/database.ts');
const repo = await import('../lib/crm/repository.ts');
const {processNotifications,retryNotification} = await import('../lib/crm/notifications.ts');
const {emailConfigured} = await import('../lib/crm/notification-config.ts');
const {parsePublicEnquiry} = await import('../lib/crm/validation.ts');
const {sendZeptoMail} = await import('../lib/crm/zeptomail.ts');
const enquiry = {name:'Ahmet Yılmaz',phone:'05000000000',email:'customer@example.invalid',company:'Test Firma',projectType:'Çatı Tipi',message:'Konum Gebze; aylık tüketim 1000 kWh, çatı 150 m². <script>bad()</script>',consent:true};
const create = async () => repo.getLead((await repo.createWebsiteLead(parsePublicEnquiry(enquiry),randomUUID())).id);
const accepted = () => new Response(JSON.stringify({data:[{code:'EM_104',message:'OK'}],message:'OK',request_id:randomUUID()}),{status:200});
const sample = {from,to:{address:enquiry.email,name:'Ahmet Yılmaz'},replyTo:'iletisim@asirsolar.com',subject:'Talebinizi aldık',text:'Teşekkür ederiz.',html:'<p>Teşekkür ederiz.</p>',messageId:'<test@www.asirsolar.com>'};

test('ZeptoMail REST notification delivery (all provider calls mocked)',async t=>{
  await db.initializeDatabase();
  t.after(async()=>{mock.restoreAll();await db.closeDatabase();});
  t.beforeEach(()=>{
    active();
    mock.method(nodemailer,'createTransport',()=>{throw Error('SMTP fallback forbidden in ZeptoMail mode');});
    mock.method(globalThis,'fetch',()=>{throw Error('All external requests must be explicitly mocked');});
  });
  t.afterEach(()=>mock.restoreAll());

  await t.test('valid submission sends separate customer, Onur and Furkan emails; SMS credentials missing',async()=>{
    // Even an accidentally enabled SMS flag must not prevent email/DB when credentials are missing.
    process.env.CRM_SMS_ENABLED='true';
    const key=randomUUID();
    const [first,duplicate]=await Promise.all([repo.createWebsiteLead(parsePublicEnquiry(enquiry),key),repo.createWebsiteLead(parsePublicEnquiry(enquiry),key)]);
    assert.equal(first.id,duplicate.id);
    const calls=[];
    mock.method(globalThis,'fetch',async(url,options)=>{calls.push({url,options,body:JSON.parse(options.body)});return accepted();});
    await Promise.all([processNotifications(first.id),processNotifications(first.id)]);
    const detail=await repo.getLead(first.id);
    assert.equal(calls.length,3);
    assert.ok(detail.deliveries.every(row=>row.status==='sent'&&row.attempts===1));
    assert.ok(detail.smsDeliveries.every(row=>row.status==='held'&&row.attempts===0));
    assert.deepEqual(calls.map(call=>call.body.to[0].email_address.address).sort(),['customer@example.invalid','furkan.cansever@asirsolar.com','onur.durak@asirsolar.com']);
    for(const {url,options,body} of calls){
      assert.equal(url,'https://api.zeptomail.com/v1.1/email');
      assert.equal(options.headers.Authorization,`Zoho-enczapikey ${fakeToken}`);
      assert.equal(options.redirect,'error');assert.ok(options.signal instanceof AbortSignal);
      assert.deepEqual(body.from,{address:'iletisim@asirsolar.com',name:'Asır Solar İletişim'});
      assert.equal(body.to.length,1);assert.equal(body.cc,undefined);assert.equal(body.bcc,undefined);
      assert.equal(body.track_opens,false);assert.equal(body.track_clicks,false);
      assert.equal(body.mime_headers['Auto-Submitted'],'auto-generated');
      assert.ok(detail.deliveries.some(row=>row.id===body.client_reference));
      assert.ok(body.textbody&&body.htmlbody);assert.ok(!body.htmlbody.includes('<script>'));
      assert.ok(!JSON.stringify(body).includes(fakeToken)&&!JSON.stringify(body).includes('info@asirsolar.com'));
      if(body.to[0].email_address.address===enquiry.email){
        assert.deepEqual(body.reply_to,[{address:'iletisim@asirsolar.com',name:''}]);
        assert.match(body.textbody,/Talebinizi aldık/);assert.ok(!body.htmlbody.includes('/admin/'));
        assert.ok(!body.textbody.includes(enquiry.message));
      }else{
        assert.deepEqual(body.reply_to,[{address:enquiry.email,name:''}]);
        for(const value of [enquiry.name,enquiry.phone,enquiry.email,enquiry.company,enquiry.projectType,enquiry.message,first.id,first.reference,`https://www.asirsolar.com/admin/talepler/${first.id}`])assert.ok(body.textbody.includes(value));
        assert.ok(body.htmlbody.includes('&lt;script&gt;bad()&lt;/script&gt;'));
      }
    }
    await processNotifications(first.id);assert.equal(calls.length,3);
  });
  await t.test('missing token or disabled email holds jobs without SMTP fallback or failed submissions',async()=>{
    for(const state of ['missing','disabled']){
      active();if(state==='missing')delete process.env.CRM_ZEPTOMAIL_TOKEN;else process.env.CRM_EMAIL_ENABLED='false';
      if(state==='missing')assert.equal(emailConfigured(),false);
      let calls=0;mock.method(globalThis,'fetch',async()=>{calls++;throw Error('must not call');});
      const item=await create();await processNotifications(item.lead.id);
      const detail=await repo.getLead(item.lead.id);
      assert.equal(calls,0);assert.ok([...detail.deliveries,...detail.smsDeliveries].every(row=>row.status==='held'));
      active();await processNotifications(item.lead.id);assert.equal(calls,0,'enabling must not release old held jobs');
    }
  });
  await t.test('customer API rejection preserves lead and still sends both engineer emails',async()=>{
    const item=await create();let calls=0;const logs=[];
    mock.method(console,'error',(...args)=>logs.push(args.join(' ')));
    mock.method(globalThis,'fetch',async(_url,options)=>{calls++;return JSON.parse(options.body).to[0].email_address.address===enquiry.email
      ? new Response(JSON.stringify({error:{message:fakeToken+' '+enquiry.message}}),{status:401}):accepted();});
    await processNotifications(item.lead.id);
    const detail=await repo.getLead(item.lead.id);
    assert.equal(detail.lead.message,enquiry.message);assert.equal(calls,3);
    assert.equal(detail.deliveries.find(row=>row.purpose==='customer_receipt').status,'failed');
    assert.ok(detail.deliveries.filter(row=>row.purpose==='team').every(row=>row.status==='sent'));
    assert.equal(detail.deliveries.find(row=>row.purpose==='customer_receipt').errorCode,'zeptomail_http_401');
    assert.ok(!JSON.stringify({logs,deliveries:detail.deliveries}).includes(fakeToken));
  });
  await t.test('rate limiting retries safely; timeouts, 5xx and malformed success never blindly resend',async()=>{
    for(const scenario of ['429','500','timeout','invalid','missing_id']){
      const item=await create();let calls=0;
      mock.method(globalThis,'fetch',async()=>{calls++;if(scenario==='timeout')throw new Error(fakeToken);
        if(scenario==='invalid')return new Response('invalid body '+fakeToken,{status:200});
        if(scenario==='missing_id')return new Response(JSON.stringify({data:[{code:'EM_104'}]}));
        return new Response(fakeToken,{status:Number(scenario)});
      });
      await processNotifications(item.lead.id);await processNotifications(item.lead.id);
      const detail=await repo.getLead(item.lead.id);assert.equal(calls,3);
      assert.ok(detail.deliveries.every(row=>scenario==='429'?row.status==='failed'&&row.retryable:row.status==='unknown'&&!row.retryable));
      assert.ok(!JSON.stringify(detail.deliveries).includes(fakeToken));
      if(scenario==='429'){
        await db.getDatabase().prepare('UPDATE email_outbox SET available_at=0 WHERE lead_id=?').run(item.lead.id);
        mock.method(globalThis,'fetch',async()=>accepted());await processNotifications(item.lead.id);
        assert.ok((await repo.getLead(item.lead.id)).deliveries.every(row=>row.status==='sent'&&row.attempts===2));
      }else await assert.rejects(retryNotification(item.lead.id,'email',detail.deliveries[0].id,'unused'),error=>error.status===409);
    }
  });
  await t.test('SMS provider failure does not destroy the lead or successful emails',async()=>{
    Object.assign(process.env,{CRM_SMS_ENABLED:'true',CRM_NETGSM_USERCODE:'test-only',CRM_NETGSM_PASSWORD:'test-only',CRM_NETGSM_HEADER:'TEST'});
    const item=await create();const sms=[];
    mock.method(globalThis,'fetch',async(url,options)=>{
      if(url==='https://api.zeptomail.com/v1.1/email')return accepted();
      assert.equal(url,'https://api.netgsm.com.tr/sms/rest/v2/send');sms.push(JSON.parse(options.body));
      return new Response(JSON.stringify({code:'30'}),{status:400});
    });
    await processNotifications(item.lead.id);
    const detail=await repo.getLead(item.lead.id);
    assert.equal(detail.lead.name,enquiry.name);assert.ok(detail.deliveries.every(row=>row.status==='sent'));
    assert.ok(detail.smsDeliveries.every(row=>row.status==='failed'));assert.equal(sms.length,2);
    assert.deepEqual(sms.map(value=>value.messages[0].no).sort(),['5419243545','5431185861']);
    assert.ok(sms.every(value=>value.messages[0].msg.includes(enquiry.name)&&value.messages[0].msg.includes('çatı projesi')&&value.messages[0].msg.includes(`/admin/talepler/${item.lead.id}`)));
  });
  await t.test('invalid customer addresses, headers and provider configuration are rejected before fetch',async()=>{
    for(const email of [undefined,'','invalid','a,b@example.invalid','user\u0001@example.invalid','user@example.invalid\r\nBcc:other@example.invalid'])assert.throws(()=>parsePublicEnquiry({...enquiry,email}));
    let calls=0;mock.method(globalThis,'fetch',()=>{calls++;throw Error('must not call');});
    for(const change of [{from:from+'\r\nBcc:other@example.invalid'},{replyTo:'one@example.invalid,two@example.invalid'},{to:{address:'a,b@example.invalid',name:''}},{to:{address:enquiry.email,name:'User\r\nBcc:other@example.invalid'}},{subject:'Test\r\nBcc:other@example.invalid'}]){
      await assert.rejects(sendZeptoMail({...sample,...change},'test-reference'),error=>error.code==='email_address_or_header_invalid');
    }
    for(const change of [{CRM_EMAIL_PROVIDER:'unknown'},{CRM_ZEPTOMAIL_TOKEN:''},{CRM_ZEPTOMAIL_TOKEN:'Zoho-enczapikey '+fakeToken},{CRM_EMAIL_FROM:'bad'},{CRM_EMAIL_REPLY_TO:'a,b@example.invalid'},{APP_ORIGIN:'http://example.invalid'}]){
      active();Object.assign(process.env,change);assert.equal(emailConfigured(),false);
    }
    assert.equal(calls,0);
  });
});
