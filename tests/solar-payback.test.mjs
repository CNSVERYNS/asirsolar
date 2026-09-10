import test from "node:test";
import assert from "node:assert/strict";
import { calculatePayback } from "../lib/solar-payback.ts";

const scenario = { investment: 100000, generation: 20000, selfConsumptionPercent: 75, avoidedUnitCost: 2, exportUnitValue: 1, annualCost: 1000 };

test("payback separates own consumption, export value and maintenance", () => {
  assert.deepEqual(calculatePayback(scenario), { selfConsumed: 15000, exported: 5000, annualSavings: 30000, annualExportValue: 5000, netAnnualBenefit: 34000, paybackYears: 100000 / 34000 });
});
test("unvalued exports cannot create savings or a payback promise", () => {
  const result = calculatePayback({ ...scenario, selfConsumptionPercent: 0, exportUnitValue: 0, annualCost: 0 });
  assert.equal(result.netAnnualBenefit, 0);
  assert.equal(result.paybackYears, null);
  assert.equal(calculatePayback({ ...scenario, annualCost: 40000 }).paybackYears, null);
});
test("fully self consumed generation has no export income", () => {
  const result = calculatePayback({ ...scenario, selfConsumptionPercent: 100 });
  assert.equal(result.exported, 0);
  assert.equal(result.annualExportValue, 0);
});
test("invalid, negative and overflowing assumptions are rejected", () => {
  for (const [key, value] of [["investment", 0], ["generation", 0], ["annualCost", -1], ["selfConsumptionPercent", 101], ["avoidedUnitCost", NaN], ["exportUnitValue", Infinity], ["generation", Number.MAX_VALUE]]) {
    assert.equal(calculatePayback({ ...scenario, [key]: value }), null, `${key}: ${value}`);
  }
});
