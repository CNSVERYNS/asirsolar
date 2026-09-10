import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

await mkdir('.local-tools',{recursive:true});
const dataDir=await mkdtemp(resolve('.local-tools/crm-http-'));
// Explicit empty values override any .env.local deployment settings in the child.
const isolated={DATABASE_URL:'',VERCEL:'',CRM_SMTP_HOST:'',CRM_LOCAL_DATABASE:'true',CRM_LOCAL_PATH:dataDir,APP_ORIGIN:'http://localhost:3001',CRON_SECRET:'integration-cron-secret',NODE_ENV:'production'};
Object.assign(process.env,isolated);
const {provisionAdmin,adminAccounts}=await import('../lib/crm/auth.ts');
const {closeDatabase}=await import('../lib/crm/database.ts');
const password=randomUUID()+randomUUID();
await provisionAdmin(adminAccounts[0].email,password);
await closeDatabase();
let logs='';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3001'],{env:{...process.env,...isolated},windowsHide:true,stdio:['ignore','pipe','pipe']});
server.stdout.on('data',data=>{logs+=data.toString();});server.stderr.on('data',data=>{logs+=data.toString();});
const base=isolated.APP_ORIGIN;
const request=(path,{method='GET',body,auth='',origin=base,headers={}}={})=>fetch(base+path,{method,redirect:'manual',headers:{Origin:origin,...(body!==undefined?{'Content-Type':'application/json'}:{}),...(auth?{Cookie:auth}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});
const json=async(response,status)=>{assert.equal(response.status,status);return response.json();};
try {
  let ready=false;
  for(let i=0;i<80;i++){
    if(server.exitCode!==null)throw new Error(`Server exited: ${logs}`);
    try { if((await fetch(base+'/robots.txt')).ok){ready=true;break;} }catch{}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  assert.ok(ready,'production server ready');
  assert.equal((await request('/admin')).status,307);
  assert.equal((await request('/admin/ayarlar')).status,307);
  const login=await request('/admin/giris');assert.equal(login.status,200);assert.match(login.headers.get('x-robots-tag'),/noindex/);
  for(const path of ['/api/admin/talepler','/api/admin/talepler/missing'])assert.equal((await request(path)).status,401);
  for(const action of ['update','note','archive','retry-email'])assert.equal((await request('/api/admin/talepler/missing',{method:'PATCH',body:{action}})).status,401);
  assert.equal((await request('/api/admin/talepler',{method:'POST',body:{}})).status,401);
  assert.equal((await request('/api/admin/parola',{method:'POST',body:{}})).status,401);
  assert.equal((await request('/api/cron/bildirimler')).status,401);
  const cron=await json(await request('/api/cron/bildirimler',{headers:{Authorization:'Bearer '+isolated.CRON_SECRET}}),200);assert.equal(cron.configured,false);
  assert.equal((await request('/api/admin/giris',{method:'POST',origin:'https://attacker.invalid',body:{}})).status,403);
  assert.equal((await request('/api/admin/giris',{method:'POST',body:{email:adminAccounts[0].email,password:'bad'}})).status,401);
  const signedIn=await request('/api/admin/giris',{method:'POST',body:{email:adminAccounts[0].email,password}});
  await json(signedIn,200);
  const cookie=signedIn.headers.get('set-cookie');for(const flag of [/HttpOnly/i,/Secure/i,/SameSite=lax/i])assert.match(cookie,flag);
  const auth=cookie.split(';')[0];
  assert.equal((await request('/admin',{auth})).status,200);
  const enquiry={name:'HTTP Test Müşteri',phone:'05321234567',email:'http@example.invalid',company:'Test <script>alert(1)</script>',projectType:'Çatı Tipi',message:'Bir çatı projesi için keşif istiyoruz.',consent:true,website:''};
  const key=randomUUID();
  assert.equal((await request('/api/talepler',{method:'POST',origin:'https://attacker.invalid',body:enquiry,headers:{'Idempotency-Key':key}})).status,403);
  assert.equal((await request('/api/talepler',{method:'POST',body:{...enquiry,consent:false},headers:{'Idempotency-Key':key}})).status,400);
  const created=await json(await request('/api/talepler',{method:'POST',body:enquiry,headers:{'Idempotency-Key':key}}),201);
  const duplicate=await json(await request('/api/talepler',{method:'POST',body:enquiry,headers:{'Idempotency-Key':key}}),200);assert.equal(created.reference,duplicate.reference);
  assert.equal((await request('/api/talepler',{method:'POST',body:{...enquiry,message:'A different project request.'},headers:{'Idempotency-Key':key}})).status,409);
  const dashboard=await json(await request('/api/admin/talepler',{auth}),200);assert.equal(dashboard.total,1);
  const id=dashboard.leads[0].id;
  const page=await request('/admin/talepler/'+id,{auth});const html=await page.text();assert.equal(page.status,200);assert.ok(!html.includes('<script>alert(1)</script>'));
  const detail=await json(await request('/api/admin/talepler/'+id,{auth}),200);assert.equal(detail.deliveries.length,2);
  const manualBody={name:'Telefon Test',phone:'05321234567',email:'',company:'',message:'',projectType:'Diğer / Bilmiyorum',source:'phone',stage:'new',priority:'normal',assigneeId:'onur',nextFollowUp:'',quoteAmount:'',rejectionReason:''};
  const manual=await json(await request('/api/admin/talepler',{method:'POST',auth,body:manualBody}),201);
  const url='/api/admin/talepler/'+manual.lead.id;
  const updated=await json(await request(url,{method:'PATCH',auth,body:{...manualBody,action:'update',stage:'proposal',quoteAmount:'19999.95',version:1}}),200);assert.equal(updated.lead.quoteCents,1999995);
  assert.equal((await request(url,{method:'PATCH',auth,body:{...manualBody,action:'update',version:1}})).status,409);
  const note=await json(await request(url,{method:'PATCH',auth,body:{action:'note',note:'Müşteriyle görüşüldü.'}}),200);assert.equal(note.events[0].kind,'note');
  const archived=await json(await request(url,{method:'PATCH',auth,body:{action:'archive',archived:true,version:2}}),200);assert.ok(archived.lead.archivedAt);
  const badJson=await fetch(base+'/api/admin/talepler',{method:'POST',headers:{Origin:base,Cookie:auth,'Content-Type':'application/json'},body:'{broken'});assert.equal(badJson.status,400);
  assert.equal((await request('/api/admin/talepler',{method:'POST',auth,body:{huge:'x'.repeat(17000)}})).status,413);
  await json(await request('/api/admin/cikis',{method:'POST',auth}),200);
  assert.equal((await request('/api/admin/talepler',{auth})).status,401);
  // Existing public pages and media must remain intact on the production server.
  await new Promise((resolve,reject)=>{const check=spawn(process.execPath,['scripts/check-site.mjs',base],{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';check.stdout.on('data',data=>{output+=data});check.stderr.on('data',data=>{output+=data});check.on('exit',code=>code===0?(console.log(output.trim()),resolve()):reject(new Error(output)));});
  console.log('PASS: production HTTP authentication, CSRF, private endpoints, real form persistence, duplicate protection, manual leads, stages, notes, archive, size limits, cron authorization and logout.');
} catch(error){console.error(logs);throw error;}
finally {server.kill();}
