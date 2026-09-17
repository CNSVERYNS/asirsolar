import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

async function files(path) {
  const entries=await readdir(path,{withFileTypes:true});
  return (await Promise.all(entries.map(entry=>entry.isDirectory()?files(join(path,entry.name)):[join(path,entry.name)]))).flat();
}
const forbidden=['CRM_ZEPTOMAIL_TOKEN','CRM_NETGSM_PASSWORD','CRM_SMTP_PASSWORD','DATABASE_URL','CRON_SECRET','Zoho-enczapikey','https://api.zeptomail.com/v1.1/email','quote_tokens','quote_token','quote_number_seq'];
// Optional synthetic build canaries are read without ever printing their values.
for(const name of ['CRM_ZEPTOMAIL_TOKEN','CRM_NETGSM_PASSWORD','CRM_SMTP_PASSWORD']){
  if(process.env[name])forbidden.push(process.env[name]);
}
const assets=(await files('.next/static')).filter(path=>/\.(?:js|json|map|html)$/.test(path));
assert.ok(assets.length>0,'Client build assets must exist');
for(const path of assets){
  const content=await readFile(path,'utf8');
  assert.ok(!forbidden.some(value=>content.includes(value)),`Server communication configuration found in client artifact: ${path}`);
}
for(const path of ['lib/crm/notifications.server.ts','app/api/talepler/route.ts','app/api/cron/bildirimler/route.ts']){
  const content=await readFile(path,'utf8');
  assert.ok(path.endsWith('.server.ts')?content.includes('import "server-only"'):content.includes('notifications.server'),'Server-only notification entrypoint required');
}
const activeFiles=['lib/crm/email.ts','lib/crm/notification-config.ts','lib/crm/notification-templates.ts','lib/crm/zeptomail.ts','data/company.ts','.env.example'];
for(const path of activeFiles)assert.ok(!(await readFile(path,'utf8')).includes('info@asirsolar.com'),`Obsolete communication address in ${path}`);
console.log(`PASS: ${assets.length} client artifacts checked; no communication secrets, provider code or old production sender exposed.`);
