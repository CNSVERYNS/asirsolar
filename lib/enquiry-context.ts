import { localAreas } from "../data/local-areas.ts";
import { solarLocations } from "./solar-estimate.ts";
import { resolveProjectType } from "./enquiry.ts";

export type ContactParams = Record<string, string | string[] | undefined>;
const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });
const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
// A compact, shareable estimate summary. It contains no contact information.
export function estimateContactHref(location: string, roof: number, bill: number, power: number, generation: number) {
  const values = [roof, bill, power, generation].map(value => Number(value.toFixed(1)));
  return `/iletisim?proje=isletme&hesap=${[location, ...values].join(",")}#contact-form`;
}
function estimateMessage(value: unknown) {
  if (typeof value !== "string" || value.length > 150) return "";
  const parts = value.split(",");
  const location = solarLocations.find(item => item.id === parts[0]);
  if (!location || parts.length !== 5 || parts.slice(1).some(part => !/^\d+(\.\d)?$/.test(part))) return "";
  const [roof, bill, power, generation] = parts.slice(1).map(Number);
  if (roof <= 0 || roof > 1e6 || bill <= 0 || bill > 1e9 || power < 0 || power > 1e6 || generation < 0 || generation > 1e10) return "";
  return `GES ön değerlendirmesi: ${location.label}; çatı ${number.format(roof)} m²; aylık fatura ${money.format(bill)}; yaklaşık ${number.format(power)} kWp ve ${number.format(generation)} kWh/yıl. Varsayımları saha keşfiyle doğrulamak ve teklif almak istiyorum.`;
}
export function contactContext(params: ContactParams) {
  const area = typeof params.bolge === "string" ? localAreas.find(item => item.slug === params.bolge) : undefined;
  const message = typeof params.mesaj === "string" ? params.mesaj
    : estimateMessage(params.hesap) || (area ? `${area.name} içindeki tesisimiz için çatı GES keşfi ve teknik teklif istiyoruz.`
      : params.konu === "fizibilite" ? "GES projem için ücretsiz ön fizibilite raporu hakkında görüşmek istiyorum." : "");
  return {
    projectType: resolveProjectType(params.proje ?? (area ? "isletme" : undefined)),
    message: message.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, 1000),
  };
}
