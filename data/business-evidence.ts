import type { DayOfWeek } from "schema-dts";
import { company } from "./company.ts";
export type BusinessEvidence = {
  geo?: { latitude: number; longitude: number };
  openingHours?: { days: DayOfWeek[]; opens: string; closes: string }[];
  priceRange?: string;
  socialProfiles: string[];
};
// Only owner-confirmed public facts belong here. An address is not proof of coordinates or opening hours.
export const businessEvidence: BusinessEvidence = {
  socialProfiles: [],
  // Owner-confirmed pricing policy; no invented amount or relative price tier.
  priceRange: company.pricing.range,
  openingHours: [{ days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "17:00" }],
};
export type VerifiedReview = {
  id: string; customerName: string; text: string; rating: number; date: string;
  publicationConsent: true; verifiedProject: string;
};
export const verifiedReviews: VerifiedReview[] = [];
