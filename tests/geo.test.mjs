import test from 'node:test';
import assert from 'node:assert/strict';
import {publicCrawlers,publicCrawlerRules} from '../lib/crawlers.ts';
import {gesCalculatorDefaults,calculateGesScenario} from '../lib/ges-calculator.ts';
import {roofGuideFaq,roofGuidePath,roofGuideSteps} from '../data/roof-guide.ts';
import {faqSchema} from '../lib/schema-builders.ts';
import {businessGraph} from '../lib/structured-data.ts';
import {findPublicPage} from '../lib/seo-catalog.ts';

test('AI search and training bots may crawl public pages while each group excludes private paths',()=>{
 for(const bot of ['*',...publicCrawlers]){
  const rule=publicCrawlerRules.find(item=>item.userAgent===bot);assert.ok(rule,bot);
  assert.ok(rule.allow.includes('/'));assert.ok(rule.allow.includes('/api/projeler/gorseller/'));
  for(const path of ['/admin','/api/','/teklif/'])assert.ok(rule.disallow.includes(path),bot);
 }
 for(const bot of ['OAI-SearchBot','ChatGPT-User','Claude-SearchBot','PerplexityBot','Google-Extended'])assert.ok(publicCrawlers.includes(bot));
});
test('calculator reacts to cost and roof inputs, rejects invalid values and never fixes the payback period',()=>{
 const baseline=calculateGesScenario(gesCalculatorDefaults);assert.ok(baseline);
 assert.equal(baseline.suggestedKwp,Math.min(baseline.roofCapacityKwp,baseline.annualDemandKwh/(baseline.annualGenerationKwh/baseline.suggestedKwp)));
 const expensive=calculateGesScenario({...gesCalculatorDefaults,costPerKwp:50000,maintenancePercent:0});
 const cheaper=calculateGesScenario({...gesCalculatorDefaults,costPerKwp:25000,maintenancePercent:0});
 assert.equal(expensive.paybackYears,cheaper.paybackYears*2);
 assert.ok(calculateGesScenario({...gesCalculatorDefaults,roofArea:10}).suggestedKwp<baseline.suggestedKwp);
 assert.equal(calculateGesScenario({...gesCalculatorDefaults,selfConsumptionPercent:0}).paybackYears,null);
 assert.ok(calculateGesScenario({...gesCalculatorDefaults,maintenancePercent:100}).annualNetBenefit<0);
 for(const values of [{monthlyBill:NaN},{roofArea:0},{unitCost:0},{costPerKwp:Infinity},{location:'imaginary'},{selfConsumptionPercent:101},{monthlyBill:'5000'}])assert.equal(calculateGesScenario({...gesCalculatorDefaults,...values}),null);
});
test('roof FAQ uses the visible source and identifies the same real organization without credentials or ratings',()=>{
 assert.equal(roofGuideSteps.length,4);assert.ok(findPublicPage(roofGuidePath));
 assert.deepEqual(faqSchema(roofGuideFaq).mainEntity.map(item=>item.acceptedAnswer.text),roofGuideFaq.map(item=>item.answer));
 const organization=businessGraph['@graph'].find(item=>item['@type']==='Organization');
 const business=businessGraph['@graph'].find(item=>item['@type']==='LocalBusiness');
 assert.equal(organization['@id'],business['@id']);assert.equal(organization.legalName,business.legalName);
 assert.ok(!organization.hasCredential&&!organization.aggregateRating&&!business.hasCredential);
});
