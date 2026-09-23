import test from 'node:test';
import assert from 'node:assert/strict';
import {publicRedirects,canonicalPublicPath} from '../lib/redirects.ts';
import {publicPages} from '../lib/seo-catalog.ts';
import {projectTypes,projectTypeKey,resolveProjectType} from '../lib/enquiry.ts';
import {contactContext,estimateContactHref} from '../lib/enquiry-context.ts';

test('published aliases have unique sources, short canonical destinations and no chains',()=>{
  const sources = new Set(publicRedirects.map(item=>item.source));
  const paths = new Set(publicPages.map(item=>item.path));
  assert.equal(sources.size,publicRedirects.length);
  for(const redirect of publicRedirects){
    assert.equal(redirect.permanent,true);
    assert.ok(!sources.has(redirect.destination));
    if(!redirect.source.includes(':'))assert.ok(paths.has(redirect.destination),redirect.destination);
  }
  for(const path of paths){assert.ok(!sources.has(path));assert.ok(path.length<=40,path);}
  assert.equal(canonicalPublicPath('/rehber/gunes-panelleri-bakim-gerektirir-mi'),'/rehber/panel-bakimi');
  assert.equal(canonicalPublicPath('/ges-kurulumu/kocaeli/gebze-osb'),'/bolgeler/kocaeli/gebze-osb');
  assert.equal(canonicalPublicPath('/teklif/private-token'),'/teklif/private-token');
});
test('short contact links and existing encoded project selections prefill the same form',()=>{
  for(const type of projectTypes)assert.equal(resolveProjectType(projectTypeKey(type)),type);
  assert.equal(contactContext({proje:'konut'}).projectType,'Konut / Villa');
  const area=contactContext({bolge:'gebze-osb'});assert.equal(area.projectType,'İşletme / Fabrika');assert.match(area.message,/GOSB/);
  assert.equal(contactContext({bolge:'invented'}).message,'');
  assert.match(contactContext({konu:'fizibilite'}).message,/fizibilite/);
  assert.equal(contactContext({mesaj:'Legacy message\u0000'}).message,'Legacy message');
  const url=new URL(estimateContactHref('kocaeli',150,5000,17.5,25000),'https://example.invalid');
  assert.ok(url.pathname.length+url.search.length<90);
  const estimate=contactContext(Object.fromEntries(url.searchParams));
  assert.equal(estimate.projectType,'İşletme / Fabrika');assert.match(estimate.message,/150 m²/);assert.match(estimate.message,/17,5 kWp/);
  for(const hesap of ['unknown,150,5000,17.5,25000','kocaeli,-1,5000,10,20000','kocaeli,NaN,1,1,1','kocaeli,1,1,1,1,1','kocaeli,1e6,1,1,1','<script>', ['kocaeli,1,1,1,1']])assert.equal(contactContext({hesap}).message,'');
});
