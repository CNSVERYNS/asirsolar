import { z } from "zod";
import { calculateSolarEstimate, solarLocations } from "./solar-estimate.ts";

export const gesCalculatorSchema = z.object({
  monthlyBill: z.number().finite().min(100).max(1e6),
  roofArea: z.number().finite().min(10).max(1e5),
  location: z.string().refine(value => solarLocations.some(item => item.id === value)),
  unitCost: z.number().finite().min(0.01).max(1000),
  costPerKwp: z.number().finite().min(1).max(1e7),
  usableRoofPercent: z.number().finite().min(1).max(100),
  areaPerKwp: z.number().finite().min(2).max(30),
  selfConsumptionPercent: z.number().finite().min(0).max(100),
  maintenancePercent: z.number().finite().min(0).max(100),
});
export type GesCalculatorValues = z.infer<typeof gesCalculatorSchema>;
// Editable example assumptions, not a market price or promised payback period.
export const gesCalculatorDefaults: GesCalculatorValues = {
  monthlyBill: 5000, roofArea: 150, location: "kocaeli", unitCost: 5,
  costPerKwp: 25000, usableRoofPercent: 70, areaPerKwp: 6,
  selfConsumptionPercent: 80, maintenancePercent: 1,
};
export function calculateGesScenario(values: unknown) {
  const parsed = gesCalculatorSchema.safeParse(values);
  return parsed.success ? calculateSolarEstimate(parsed.data) : null;
}
