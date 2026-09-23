import assert from 'node:assert/strict';
import sharp from 'sharp';

// GET-only: safe for production; never submits forms or authenticates to CRM.
const target=new URL(process.argv[2]||'http://localhost:3000').origin;
const get=path=>fetch(new URL(path,target),{redirect:'manual',signal:AbortSignal.timeout(60000)});
const pages=['/','/ges-hesaplama','/ges-kurulumu','/ges-kurulumu/kocaeli','/ges-kurulumu/kocaeli/gebze-osb','/hizmetler/endustriyel-cati-ges','/hizmetler/arazi-ges','/iletisim'];
for(const path of pages){
 const response=await get(path);assert.equal(response.status,200,path);const html=await response.text();
 assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.ok(!response.headers.get('content-security-policy').includes('unsafe-eval'));
 assert.equal(response.headers.get('x-frame-options'),'DENY');assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.match(response.headers.get('strict-transport-security'),/max-age=31536000/);
 assert.equal(response.headers.get('referrer-policy'),'strict-origin-when-cross-origin');assert.equal(response.headers.get('x-powered-by'),null);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1,path);assert.ok(html.includes('href="#main"'));assert.ok(html.includes('id="main"'));
 const headings=[...html.matchAll(/<h([1-6])[\s>]/g)].map(match=>Number(match[1]));let previous=0;
 for(const heading of headings){assert.ok(heading<=previous+1,`${path}: heading skipped h${previous} -> h${heading}`);previous=heading;}
 assert.match(html,/<meta property="og:image" content="https:\/\//);assert.match(html,/<meta name="twitter:card" content="summary_large_image"/);
 if(path.includes('gebze-osb'))assert.ok(html.includes('gosb.com.tr'));
}
for(const path of ['/ges-kurulumu/uydurma','/ges-kurulumu/kocaeli/uydurma','/og-image?path=%2Fadmin','/og-image?path=https://attacker.invalid'])assert.equal((await get(path)).status,404,path);
for(const path of ['/','/ges-kurulumu/kocaeli/gebze-osb','/hizmetler/endustriyel-cati-ges']){
 const response=await get('/og-image?path='+encodeURIComponent(path));assert.equal(response.status,200,path);assert.match(response.headers.get('content-type'),/image\/png/);
 const dimensions=await sharp(Buffer.from(await response.arrayBuffer())).metadata();assert.equal(dimensions.width,1200);assert.equal(dimensions.height,630);
}
const nonces=[];
for(let i=0;i<2;i++){
 const response=await get('/admin/giris');assert.equal(response.status,200);const policy=response.headers.get('content-security-policy');const nonce=policy.match(/'nonce-([^']+)'/)?.[1];assert.ok(nonce);nonces.push(nonce);
 assert.ok(!policy.split(';').find(item=>item.trim().startsWith('script-src')).includes('unsafe-inline'));
 const html=await response.text();assert.ok(html.includes('nonce="'+nonce+'"'),'Next bootstrap nonce matches CSP');assert.match(response.headers.get('cache-control'),/no-store/);
}
assert.notEqual(nonces[0],nonces[1]);
const prefilling=await get('/iletisim?mesaj='+encodeURIComponent('<script>alert(1)</script> Fizibilite talebi'));
assert.equal(prefilling.status,200);const html=await prefilling.text();assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(html.includes('&lt;script&gt;'));
const robots=await (await get('/robots.txt')).text();assert.match(robots,/Allow: \/api\/projeler\/gorseller\//);assert.match(robots,/Disallow: \/teklif/);
console.log('PASS: public SEO pages, ordered headings, security headers, unique private CSP nonces, project image crawling, allowlisted local routes, escaped form prefill and three 1200x630 OG images. No provider calls.');
