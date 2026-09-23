import assert from 'node:assert/strict';
const origin=new URL(process.argv[2]||'https://www.asirsolar.com').origin;
// Unauthenticated GET only. Never invoke authenticated legacy list GET: it flushes email.
for(const [path,status] of [['/',200],['/admin/crm',307],['/api/admin/crm',401],['/api/admin/crm?q=ASR-TLP-1',401],['/api/teklif/invalid',404],['/teklif/invalid',404]]){
 const response=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,status,path);
 if(path==='/admin/crm')assert.ok(response.headers.get('location')?.endsWith('/admin/giris'));
 if(path.startsWith('/api/admin/crm'))assert.match(response.headers.get('cache-control')||'',/no-store/);
 await response.arrayBuffer();
}
console.log('PASS: production homepage, CRM auth redirect, private pipeline API and invalid quote tokens. GET only; no sends.');
