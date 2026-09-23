import baselines from "../data/solar-baselines.json" with { type: "json" };
export const solarLocations = baselines.locations;
export const solarModel = baselines;
export type SolarEstimateInput = {
  monthlyBill: number; roofArea: number; location: string; unitCost: number; costPerKwp: number;
  usableRoofPercent: number; areaPerKwp: number; selfConsumptionPercent: number; maintenancePercent: number;
};
export function calculateSolarEstimate(input: SolarEstimateInput) {
  const location = solarLocations.find(item => item.id === input.location);
  const values = [input.monthlyBill, input.roofArea, input.unitCost, input.costPerKwp, input.usableRoofPercent, input.areaPerKwp, input.selfConsumptionPercent, input.maintenancePercent];
  if (!location || values.some(value => !Number.isFinite(value) || value < 0) || input.monthlyBill <= 0 || input.monthlyBill > 1e9 || input.roofArea <= 0 || input.roofArea > 1e6 || input.unitCost <= 0 || input.unitCost > 1000 || input.costPerKwp <= 0 || input.costPerKwp > 1e7 || input.usableRoofPercent <= 0 || input.usableRoofPercent > 100 || input.areaPerKwp < 2 || input.areaPerKwp > 30 || input.selfConsumptionPercent > 100 || input.maintenancePercent > 100) return null;
  const annualDemandKwh = input.monthlyBill * 12 / input.unitCost;
  const roofCapacityKwp = input.roofArea * input.usableRoofPercent / 100 / input.areaPerKwp;
  const suggestedKwp = Math.min(roofCapacityKwp, annualDemandKwh / location.yieldKwhPerKwp);
  const annualGenerationKwh = suggestedKwp * location.yieldKwhPerKwp;
  const selfConsumedKwh = Math.min(annualDemandKwh, annualGenerationKwh * input.selfConsumptionPercent / 100);
  const investment = suggestedKwp * input.costPerKwp;
  const annualMaintenance = investment * input.maintenancePercent / 100;
  const annualSavings = selfConsumedKwh * input.unitCost;
  const annualNetBenefit = annualSavings - annualMaintenance;
  const paybackYears = annualNetBenefit > 0 ? investment / annualNetBenefit : null;
  const annualRoiPercent = annualNetBenefit / investment * 100;
  // ETKB 2023 distribution-connected consumption factor: 0.465 tCO2/MWh = 0.465 kgCO2/kWh.
  const avoidedOperationalCo2Tonnes = selfConsumedKwh * 0.465 / 1000;
  const result = { annualDemandKwh, roofCapacityKwp, suggestedKwp, annualGenerationKwh, selfConsumedKwh, exportedKwh: annualGenerationKwh - selfConsumedKwh, investment, annualMaintenance, annualSavings, annualNetBenefit, paybackYears, annualRoiPercent, avoidedOperationalCo2Tonnes };
  return Object.values(result).some(value => value !== null && !Number.isFinite(value)) ? null : result;
}
