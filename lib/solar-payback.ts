export type PaybackInput = {
  investment: number;
  generation: number;
  selfConsumptionPercent: number;
  avoidedUnitCost: number;
  exportUnitValue: number;
  annualCost: number;
};

export function calculatePayback(input: PaybackInput) {
  if (Object.values(input).some(value => !Number.isFinite(value) || value < 0)
    || input.investment <= 0 || input.generation <= 0 || input.selfConsumptionPercent > 100) {
    return null;
  }
  const selfConsumed = input.generation * input.selfConsumptionPercent / 100;
  const exported = input.generation - selfConsumed;
  const annualSavings = selfConsumed * input.avoidedUnitCost;
  const annualExportValue = exported * input.exportUnitValue;
  const netAnnualBenefit = annualSavings + annualExportValue - input.annualCost;
  const paybackYears = netAnnualBenefit > 0 ? input.investment / netAnnualBenefit : null;
  const result = { selfConsumed, exported, annualSavings, annualExportValue, netAnnualBenefit, paybackYears };
  return Object.values(result).some(value => value !== null && !Number.isFinite(value)) ? null : result;
}
