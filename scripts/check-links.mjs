import assert from 'node:assert/strict';
import {publicRedirects} from '../lib/redirects.ts';
import {publicPages} from '../lib/seo-catalog.ts';
import {estimateContactHref} from '../lib/enquiry-context.ts';

// GET-only; suitable for both an isolated production build and the live site.
const origin=new URL(process.argv[2]||'http://localhost:3000').origin;
const get=path=>fetch(new URL(path,origin),{redirect:'manual',signal:AbortSignal.timeout(30000)});
const redirects=publicRedirects.flatMap(item=>item.source.includes(':path+')
  ? ['kocaeli','kocaeli/gebze-osb'].map(path=>({...item,source:item.source.replace(':path+',path),destination:item.destination.replace(':path+',path)}))
  : [item]);
for(const {source,destination} of redirects){
  const response=await get(source+'?utm_source=url-check');
  assert.equal(response.status,308,source);
  const target=new URL(response.headers.get('location'),origin);
  assert.equal(target.origin,origin);assert.equal(target.pathname,destination,source);
  assert.equal(target.searchParams.get('utm_source'),'url-check');
  assert.equal((await get(target.pathname)).status,200,destination);
}
const projectsResponse=await get('/api/projeler');assert.equal(projectsResponse.status,200);
const {projects}=await projectsResponse.json();
const paths=[...publicPages.map(item=>item.path),...projects.map(project=>'/projeler/'+project.slug)];
const links=new Set();
for(let i=0;i<paths.length;i+=4){
  await Promise.all(paths.slice(i,i+4).map(async path=>{
    const response=await get(path);assert.equal(response.status,200,path);
    const html=await response.text();
    const canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
    assert.equal(new URL(canonical).pathname,path,path);
    for(const match of html.matchAll(/<a\b[^>]*href="(\/[^"#]*)/g)){
      const href=match[1].replaceAll('&amp;','&');
      assert.ok(href.length<160,`Long internal link: ${href}`);
      if(!/^\/(api|admin|_next)\//.test(href))links.add(href);
    }
  }));
}
for(const href of links){const response=await get(href);assert.equal(response.status,200,`Internal link: ${href}`);}
for(const project of projects){
  assert.ok(project.slug.length<=48);
  const old=await get('/projeler/'+project.id);assert.equal(old.status,308);
  assert.equal(new URL(old.headers.get('location'),origin).pathname,'/projeler/'+project.slug);
}
for(const [path,expected] of [
  ['/iletisim?proje=konut','selected="">Konut / Villa</option>'],
  ['/iletisim?bolge=gebze-osb','GOSB'],
  ['/iletisim?konu=fizibilite','ücretsiz ön fizibilite raporu'],
  [estimateContactHref('kocaeli',150,5000,17.5,25000),'17,5 kWp'],
])assert.ok((await(await get(path)).text()).includes(expected),path);
const sitemap=await(await get('/sitemap.xml')).text();
const oldPreview=await get('/og-image?path='+encodeURIComponent('/rehber/gunes-panelleri-bakim-gerektirir-mi'));
assert.equal(oldPreview.status,200);assert.match(oldPreview.headers.get('content-type'),/image\/png/);
const sitemapPaths=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>new URL(match[1]).pathname);
for(const {source} of redirects)assert.ok(!sitemapPaths.includes(source),source);
console.log(`PASS: ${redirects.length} permanent redirects preserve query parameters; ${paths.length} public pages and ${links.size} internal links; ${projects.length} stable project URLs; compact contact prefills.`);
