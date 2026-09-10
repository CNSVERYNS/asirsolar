export function buildWhatsAppContact(rawPhone: string | undefined, rawName: string | undefined) {
  const name = rawName?.trim();
  const value = rawPhone?.trim();
  if (!name || !value || !/^\+?[\d\s().-]+$/.test(value)) return null;
  let phone = value.replace(/\D/g, "");
  if (phone.startsWith("00")) phone = phone.slice(2);
  if (/^05\d{9}$/.test(phone)) phone = `90${phone.slice(1)}`;
  else if (/^5\d{9}$/.test(phone)) phone = `90${phone}`;
  if (!/^[1-9]\d{6,14}$/.test(phone)) return null;
  const message = "Merhaba, Asır Solar web sitesinden ulaşıyorum. Güneş enerjisi projem için bilgi almak istiyorum.";
  return { name, phone, href: `https://wa.me/${phone}?text=${encodeURIComponent(message)}` };
}

// Build-time public configuration. Both fields are required so no unknown
// number or unnamed recipient is shown to visitors.
export const whatsappContact = buildWhatsAppContact(
  process.env.NEXT_PUBLIC_WHATSAPP_PHONE,
  process.env.NEXT_PUBLIC_WHATSAPP_NAME,
);
