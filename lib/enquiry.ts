export const projectTypes = ["Konut / Villa", "İşletme / Fabrika", "Çatı Tipi", "Cephe Tipi", "Arazi Tipi", "Elektrik ve Pano Sistemleri", "Bakım / Teknik Destek", "Diğer / Bilmiyorum"] as const;

export type Enquiry = {
  name: string;
  phone: string;
  email: string;
  company: string;
  projectType: string;
  message: string;
  consent: boolean;
};
export type EnquiryErrors = Partial<Record<keyof Enquiry, string>>;

export function resolveProjectType(value: unknown): string {
  return typeof value === "string" && projectTypes.some((type) => type === value) ? value : "Diğer / Bilmiyorum";
}

export function validateEnquiry(values: Enquiry): EnquiryErrors {
  const errors: EnquiryErrors = {};
  if (values.name.trim().length < 2) errors.name = "Lütfen adınızı ve soyadınızı girin.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Lütfen geçerli bir e-posta adresi girin.";
  const digits = values.phone.replace(/\D/g, "");
  if (!/^[+\d\s().-]+$/.test(values.phone) || digits.length < 10 || digits.length > 15) errors.phone = "Lütfen alan koduyla birlikte geçerli bir telefon numarası girin.";
  if (!projectTypes.some((type) => type === values.projectType)) errors.projectType = "Lütfen bir proje türü seçin.";
  if (values.message.trim().length < 10) errors.message = "Projenizi en az 10 karakterle kısaca anlatın.";
  if (values.message.length > 1500) errors.message = "Mesajınızı 1500 karakterle sınırlandırın.";
  if (!values.consent) errors.consent = "Talebinizi göndermek için aydınlatma metnini okuyup onaylayın.";
  return errors;
}

export function buildEnquiryDraft(values: Enquiry, recipient: string) {
  const subject = `Keşif Talebi — ${values.name.trim()}${values.company.trim() ? ` (${values.company.trim()})` : ""}`;
  const body = `Ad Soyad: ${values.name.trim()}\nTelefon: ${values.phone.trim()}\nE-posta: ${values.email.trim()}\nFirma / Kurum: ${values.company.trim() || "—"}\nProje Türü: ${values.projectType}\n\nProje hakkında:\n${values.message.trim()}`;
  return { subject, body, mailto: `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}
