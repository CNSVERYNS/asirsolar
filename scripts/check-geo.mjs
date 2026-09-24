import assert from 'node:assert/strict';
import {publicCrawlers} from '../lib/crawlers.ts';
import {roofGuideFaq,roofGuidePath} from '../data/roof-guide.ts';
const origin=new URL(process.argv[2]||'http://localhost:3000').origin;
const canonical=new URL(process.argv[3]||'https://asirsolar.com').origin;
const get=path=>fetch(new URL(path,origin),{redirect:'manual',signal:AbortSignal.timeout(30000)});
const read=async path=>{const r=await get(path);assert.equal(r.status,200,path);return r.text();};
const schemas=html=>[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{const d=JSON.parse(m[1]);return d['@graph']||[d];});
const robots=await read('/robots.txt');
for(const bot of ['*',...publicCrawlers]){
 const block=robots.split(/\r?\n\s*\r?\n/).find(text=>text.split(/\r?\n/).includes('User-Agent: '+bot));
 assert.ok(block,bot);assert.match(block,/^Allow: \/$/m);assert.match(block,/Disallow: \/admin/);assert.match(block,/Disallow: \/teklif\//);
}
assert.ok(robots.includes(canonical+'/sitemap.xml'));
const home=await read('/');const head=home.split('</head>')[0];
assert.match(home,/<html[^>]*lang="tr"/);assert.equal((home.match(/<h1[ >]/g)||[]).length,1);
const heading=home.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
assert.equal(heading,'Endüstriyel ve Bireysel Güneş Enerjisi Sistemleri');
const business=schemas(head).find(item=>item['@type']==='LocalBusiness');assert.ok(business,'business markup in head');
assert.equal(business.url,canonical);assert.ok(schemas(head).some(item=>item['@type']==='Organization'));
assert.match(home,/class="floating-call" href="tel:/);
const guide=await read(roofGuidePath);const faq=schemas(guide).find(item=>item['@type']==='FAQPage');
assert.equal(faq.mainEntity.length,roofGuideFaq.length);
for(const item of roofGuideFaq){assert.ok(guide.includes(item.question));assert.ok(guide.includes(item.answer));}
for(let i=1;i<=4;i++)assert.ok(guide.includes(`id="adim-${i}"`));
assert.ok(schemas(guide).some(item=>item['@type']==='Article'));
const calculator=await read('/hesaplayici');
assert.ok(calculator.includes('data-testid="ges-calculator"'));assert.equal((calculator.match(/role="slider"/g)||[]).length,2);
assert.ok(calculator.includes('Yıllık finansal tasarruf'));assert.ok(calculator.includes('Basit amortisman'));
for(const old of ['/hesapla','/ges-hesaplama']){const r=await get(old);assert.equal(r.status,308);assert.equal(new URL(r.headers.get('location'),origin).pathname,'/hesaplayici');}
for(const path of ['/admin/giris','/teklif/not-a-real-token']){
 const html=await(await get(path)).text();assert.ok(!schemas(html).some(item=>['Organization','LocalBusiness'].includes(item['@type'])));
}
const sitemap=await read('/sitemap.xml');
for(const path of ['/','/hizmetler',roofGuidePath,'/hesaplayici','/iletisim'])assert.ok(sitemap.includes(canonical+path.replace(/^\/$/,'')+'</loc>'),path);
console.log('PASS: explicit AI bot groups, private-path exclusions, Turkish H1, organization schemas in head, four-step visible FAQ, SSR slider calculator, permanent calculator aliases and sitemap canonicals. GET only.');
