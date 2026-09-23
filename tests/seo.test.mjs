import test from 'node:test';
import assert from 'node:assert/strict';
import {serializeJsonLd} from '../lib/json-ld.ts';
import {breadcrumbSchema,faqSchema,installationSchema,reviewProperties,verifiedBusinessProperties} from '../lib/schema-builders.ts';
import {businessGraph,serviceSchema} from '../lib/structured-data.ts';
import {businessEvidence,verifiedReviews} from '../data/business-evidence.ts';
import {services} from '../data/services.ts';
import {findPublicPage,breadcrumbsFor,publicPages} from '../lib/seo-catalog.ts';
import {localAreas,getLocalArea,localAreaPath} from '../data/local-areas.ts';
import {pageMetadata} from '../lib/site.ts';
import {contentSecurityPolicy} from '../lib/security-headers.ts';
import {marketingConfig} from '../lib/marketing-config.ts';

test('JSON-LD cannot close its script or inject HTML, including Unicode line delimiters',()=>{
 const value={'@context':'https://schema.org','@type':'Thing',name:'</script><img src=x onerror=alert(1)>&\u2028\u2029'};
 const encoded=serializeJsonLd(value);assert.ok(!/[<>&\u2028\u2029]/.test(encoded));assert.deepEqual(JSON.parse(encoded),value);
});
test('business facts and all services share one verified provider, without invented ratings or geo',()=>{
 const business=businessGraph['@graph'][0];assert.equal(business['@type'],'LocalBusiness');assert.equal(business.telephone,'+902626446989');
 assert.deepEqual(business.openingHoursSpecification[0].dayOfWeek,['Monday','Tuesday','Wednesday','Thursday','Friday']);assert.equal(business.openingHoursSpecification[0].opens,'08:00');assert.equal(business.openingHoursSpecification[0].closes,'17:00');
 assert.ok(!business.geo&&!business.sameAs&&!business.aggregateRating);assert.equal(verifiedReviews.length,0);
 for(const service of services)assert.equal(serviceSchema(service).provider['@id'],business['@id']);
 assert.ok(services.some(service=>service.slug==='endustriyel-cati-ges'));assert.ok(services.some(service=>service.slug==='arazi-ges'));
 assert.throws(()=>verifiedBusinessProperties({...businessEvidence,geo:{latitude:100,longitude:20}}));assert.throws(()=>verifiedBusinessProperties({socialProfiles:['javascript:alert(1)']}));
});
test('reviews remain absent without evidence; invalid or duplicate verified reviews are rejected',()=>{
 assert.deepEqual(reviewProperties([]),{});
 const review={id:'fixture',customerName:'Test only',text:'Local unit test fixture',date:'2026-09-22',rating:4,publicationConsent:true,verifiedProject:'fixture-project'};
 assert.equal(reviewProperties([review]).aggregateRating.ratingValue,4);assert.throws(()=>reviewProperties([{...review,rating:6}]));assert.throws(()=>reviewProperties([{...review,publicationConsent:false}]));assert.throws(()=>reviewProperties([review,review]));
});
test('allowlisted local pages have complete breadcrumbs and reject invented locations',()=>{
 for(const area of localAreas){const items=breadcrumbsFor(localAreaPath(area));assert.equal(items.length,4);assert.equal(breadcrumbSchema(items).itemListElement[3].position,4);assert.equal(items[3].name,area.title);assert.ok(area.sources.every(source=>source.href.startsWith('https://')));}
 assert.equal(getLocalArea('istanbul','nonexistent'),undefined);assert.equal(findPublicPage('/admin'),undefined);assert.equal(findPublicPage('/teklif/secret'),undefined);assert.equal(new Set(publicPages.map(page=>page.path)).size,publicPages.length);
});
test('FAQ and HowTo are generated from visible content; dynamic metadata uses canonical path and branded image',()=>{
 assert.equal(faqSchema([{question:'Test?',answer:'Answer'}]).mainEntity[0].acceptedAnswer.text,'Answer');assert.equal(installationSchema('/hizmetler/endustriyel-cati-ges').step.length,6);
 const meta=pageMetadata({title:'Çatı GES',description:'Anlamlı test açıklaması',path:'/hizmetler/endustriyel-cati-ges'});assert.ok(meta.alternates.canonical.endsWith('/hizmetler/endustriyel-cati-ges'));assert.ok(meta.openGraph.images[0].url.includes('/og-image?path='));
});
test('production CSP blocks frames, objects and eval; private routes can use an unpredictable nonce',()=>{
 const baseline=contentSecurityPolicy();assert.match(baseline,/frame-ancestors 'none'/);assert.match(baseline,/object-src 'none'/);assert.ok(!baseline.includes('unsafe-eval'));assert.ok(!baseline.includes('google-analytics'));
 const strict=contentSecurityPolicy({nonce:'abc123'});assert.match(strict,/nonce-abc123/);assert.ok(!strict.split(';')[1].includes('unsafe-inline'));assert.throws(()=>contentSecurityPolicy({nonce:"bad'; *"}));
});
test('tracking IDs are optional, validated and GTM prevents duplicate direct installations',()=>{
 assert.equal(marketingConfig({}).enabled,false);assert.equal(marketingConfig({ga:"G-123');bad"}).enabled,false);const config=marketingConfig({gtm:'GTM-123ABC',ga:'G-123ABC',pixel:'123456789'});assert.equal(config.gtm,'GTM-123ABC');assert.equal(config.ga,undefined);assert.equal(config.pixel,undefined);
});
