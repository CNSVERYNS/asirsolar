import type { DayOfWeek } from "schema-dts";
export type BusinessEvidence = {
  geo?: { latitude: number; longitude: number };
  openingHours?: { days: DayOfWeek[]; opens: string; closes: string }[];
  priceRange?: string;
  socialProfiles: string[];
};
// Only owner-confirmed public facts belong here. An address is not proof of coordinates or opening hours.
export const businessEvidence: BusinessEvidence = { socialProfiles: [], openingHours: [{ days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "17:00" }] };
export type VerifiedReview = {
  id: string; customerName: string; text: string; rating: number; date: string;
  publicationConsent: true; verifiedProject: string;
};
export const verifiedReviews: VerifiedReview[] = [];
