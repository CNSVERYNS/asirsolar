export type LocalArea = {
  city: string; citySlug: string; district: string; slug: string; name: string; title: string;
  summary: string; updatedAt: string; sections: { title: string; text: string }[];
  checklist: string[]; sources: { label: string; href: string }[];
};
// Explicit editorial allowlist: adding a city name alone never creates an indexable page.
export const localAreas: LocalArea[] = [{
  city: "Kocaeli", citySlug: "kocaeli", district: "Gebze", slug: "gebze-osb", name: "Gebze Organize Sanayi Bölgesi (GOSB)",
  title: "Kocaeli Gebze OSB fabrika çatı GES kurulumu",
  summary: "GOSB’deki fabrikanızın çatı GES projesi için tüketim analizi, OSB bağlantı değerlendirmesi, çatı uygunluğu ve teklif hazırlığını birlikte planlayın.",
  updatedAt: "2026-09-22",
  sections: [
    { title: "GOSB bağlantısı neden ayrı değerlendirilir?", text: "GOSB, resmî elektrik hizmetleri sayfasında OSB elektrik dağıtım lisansına sahip olduğunu belirtir. Bu nedenle tesisinizin abonelik ve bağlantı belgelerini görmeden başka bir bölgenin başvuru adımlarını aynen uygulamak doğru değildir. İlk görüşmede bağlantı noktası, sözleşme gücü ve güncel OSB koşullarını birlikte netleştiririz." },
    { title: "Vardiya düzeni, çatı alanı kadar önemlidir", text: "Hafta içi gündüz çalışan bir üretim hattı ile üç vardiya çalışan bir fabrikanın öz tüketimi farklıdır. OSOS veya saatlik tüketim kayıtları varsa son 12 aylık faturalarla birlikte incelenir. Hafta sonu üretiminin nasıl değerlendirileceği de teklifin üretim ve ekonomik varsayımlarında ayrı gösterilir." },
    { title: "Yapı belgeleri ve saha erişimini birlikte hazırlayın", text: "GOSB’nin ruhsatlandırma hizmetleri proje onayı, yapı ruhsatı ve tadilat süreçlerini kapsar. Mevcut çatı statik projesi, kaplama durumu, yangın geçişleri ve bakım yolları kurulum planının girdileridir. Çatı yenilemesi veya altyapı tadilatı gerekiyorsa panel yatırımından önce kapsamı belirlenir; her saha için aynı izin listesi varsayılmaz." },
    { title: "Üretimi aksatmadan uygulama planı", text: "Yükleme alanları, vinç erişimi, vardiya girişleri ve planlı elektrik kesintileri fabrika sorumlusu ile birlikte değerlendirilir. Montaj takvimi, ekipman tedariki ve kabul koşulları netleşince hazırlanır. Çevrim içi hesaplayıcının sonucu bağlantı izni, statik uygunluk veya üretim garantisi yerine geçmez." },
  ],
  checklist: ["Tesis adresi, parsel bilgisi ve OSB aboneliği", "Son 12 aylık faturalar ve varsa saatlik tüketim verisi", "Çatı planı, mevcut statik proje ve güncel fotoğraflar", "Trafo/pano bilgileri ve sözleşme gücü", "Vardiyalar, hafta sonu çalışma ve planlı duruşlar"],
  sources: [
    { label: "GOSB — elektrik dağıtım hizmetleri", href: "https://www.gosb.com.tr/en/services/infrastructure-services/electricity" },
    { label: "GOSB — ruhsatlandırma hizmetleri", href: "https://www.gosb.com.tr/hizmetler/ruhsatlandirma-hizmetleri" },
  ],
}];
export function localAreaPath(area: LocalArea): string { return `/bolgeler/${area.citySlug}/${area.slug}`; }
export function getLocalArea(city: string, slug: string): LocalArea | undefined { return localAreas.find(area => area.citySlug === city && area.slug === slug); }
