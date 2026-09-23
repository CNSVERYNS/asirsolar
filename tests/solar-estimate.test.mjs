import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateSolarEstimate,solarLocations} from '../lib/solar-estimate.ts';
const input={monthlyBill:50000,roofArea:1000,location:'kocaeli',unitCost:5,costPerKwp:25000,usableRoofPercent:70,areaPerKwp:6,selfConsumptionPercent:80,maintenancePercent:1};
test('production estimate is capped by both roof and demand, and never invents export revenue',()=>{
 const result=calculateSolarEstimate(input);assert.ok(result);assert.ok(result.suggestedKwp<=result.roofCapacityKwp);assert.ok(result.annualGenerationKwh<=result.annualDemandKwh+1e-8);assert.equal(result.annualSavings,result.selfConsumedKwh*5);assert.equal(result.annualNetBenefit,result.annualSavings-result.annualMaintenance);assert.equal(result.paybackYears,result.investment/result.annualNetBenefit);assert.equal(result.avoidedOperationalCo2Tonnes,result.selfConsumedKwh*.465/1000);
});
test('invalid input, overflow and unknown geography do not produce misleading estimates',()=>{
 for(const patch of [{monthlyBill:NaN},{monthlyBill:Infinity},{monthlyBill:-1},{roofArea:0},{unitCost:0},{location:'not-verified'},{usableRoofPercent:101},{areaPerKwp:0},{selfConsumptionPercent:101},{costPerKwp:1e30}])assert.equal(calculateSolarEstimate({...input,...patch}),null);
 const none=calculateSolarEstimate({...input,selfConsumptionPercent:0});assert.equal(none.annualSavings,0);assert.equal(none.paybackYears,null);
});
test('larger roofs cannot exceed annual demand and cached PVGIS baselines have evidence',()=>{
 const small=calculateSolarEstimate({...input,roofArea:100}),large=calculateSolarEstimate({...input,roofArea:100000});assert.ok(small.suggestedKwp<large.suggestedKwp);assert.ok(large.annualGenerationKwh<=large.annualDemandKwh+1e-8);
 for(const location of solarLocations){assert.equal(new URL(location.source).hostname,'re.jrc.ec.europa.eu');assert.ok(location.yieldKwhPerKwp>500&&location.yieldKwhPerKwp<2500);assert.equal(location.period.length,2);}
});
