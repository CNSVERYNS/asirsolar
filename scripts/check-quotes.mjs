import assert from 'node:assert/strict';
const origin=new URL(process.argv[2]||'https://www.asirsolar.com').origin;
// GET only, no customer token/session/lead, no form, worker or provider invocation.
const cases=[['/',200],['/images/brand/asir-logo.jpeg',200],['/api/admin/teklifler?leadId=invalid',401],['/api/admin/teklifler/invalid',401],['/admin/talepler/invalid/teklifler/yeni',307],['/api/teklif/invalid',404],['/api/teklif/invalid/dosyalar/invalid',404],['/teklif/invalid',404]];
for(const [path,status] of cases){
  const response=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,status,path);
  if(path.startsWith('/teklif/')||path.startsWith('/api/teklif/')){
    assert.match(response.headers.get('x-robots-tag')||'',/noindex/);
    assert.equal(response.headers.get('referrer-policy'),'no-referrer');
    assert.match(response.headers.get('cache-control')||'',/no-store/);
    assert.equal(response.headers.get('x-frame-options'),'DENY');
  }
  await response.arrayBuffer();
}
const robots=await (await fetch(origin+'/robots.txt')).text();assert.match(robots,/Disallow: \/teklif\//);
const sitemap=await (await fetch(origin+'/sitemap.xml')).text();assert.ok(!sitemap.includes('/teklif/'));
console.log(`PASS: ${origin} quote authorization, invalid-token 404, privacy headers, branding and robots. GET only; no messages.`);
