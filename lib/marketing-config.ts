export function marketingConfig(values: { gtm?: string; ga?: string; pixel?: string }) {
  const gtm = /^GTM-[A-Z0-9]+$/.test(values.gtm || "") ? values.gtm : undefined;
  const ga = !gtm && /^G-[A-Z0-9]+$/.test(values.ga || "") ? values.ga : undefined;
  const pixel = !gtm && /^\d{5,25}$/.test(values.pixel || "") ? values.pixel : undefined;
  return { gtm, ga, pixel, enabled: Boolean(gtm || ga || pixel) };
}
export const marketing = marketingConfig({ gtm: process.env.NEXT_PUBLIC_GTM_ID, ga: process.env.NEXT_PUBLIC_GA_ID, pixel: process.env.NEXT_PUBLIC_META_PIXEL_ID });
export const trackingConsentKey = "asir-solar-tracking-consent-v1";
