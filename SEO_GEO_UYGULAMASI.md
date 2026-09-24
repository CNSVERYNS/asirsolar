# Asır Solar SEO / GEO uygulaması

Mevcut Next.js 16 App Router uygulaması geliştirilmiştir. React 19, TypeScript,
Tailwind CSS 4 (`tw:` öneki), Shadcn/Radix bileşenleri, Lucide, Framer Motion,
React Hook Form ve Zod kullanılır. Kurulu Next.js sürümü düşürülmemiştir.

## Dosya yapısı

```text
app/
  layout.tsx                              # Türkçe metadata, head içinde şirket şemaları
  page.tsx                                # Tek H1, dört hizmet, gerçek proje galerisi
  robots.ts                               # Açık arama ve AI bot kuralları
  sitemap.ts                              # Yayındaki sayfa ve projeler
  geo.css                                 # Rehber, hesaplayıcı ve mobil stiller
  catima-gunes-paneli-nasil-yaptiririm/
    page.tsx                              # Dört aşama, görünür FAQ ve JSON-LD
  hesaplayici/
    page.tsx                              # Sunucuda ilk çıktısı oluşturulan hesaplayıcı
components/
  ges-calculator.tsx                      # Slider, form, sonuç ve WhatsApp bağlantısı
  HomeProjects.tsx                        # Yönetim panelinden yayımlanan projeler
  PublicContent.tsx                       # Özel sayfalarda şirket şemalarını kaldırır
  ui/button.tsx
  ui/slider.tsx
data/
  company.ts                             # Mevcut şirket iletişim bilgileri
  roof-guide.ts                          # Rehber ve FAQ için ortak içerik kaynağı
lib/
  crawlers.ts                            # Her bot grubunda açık/özel URL ayrımı
  ges-calculator.ts                      # Zod doğrulama ve hesaplama giriş noktası
  solar-estimate.ts                      # Çatı/tüketim sınırı ve PVGIS üretimi
  solar-payback.ts                       # Öz tüketim, bakım ve geri ödeme modeli
  structured-data.ts                     # Aynı kimliği kullanan Organization/LocalBusiness
  site.ts                                # Canonical, OG, Twitter metadata yardımcıları
  redirects.ts                           # Eski URL'ler için kalıcı 308 yönlendirmeler
scripts/check-geo.mjs                     # Canlı veya yerel HTTP doğrulaması; yalnız GET
tests/geo.test.mjs                        # Hesap, bot ve şema kontrolleri
```

## İçerik ve tarama

- Ana adres `https://asirsolar.com` olarak ayarlanır. Vercel production ortamında
  `NEXT_PUBLIC_SITE_URL` ve `APP_ORIGIN` bu adresle eşleşmelidir; ilki build sırasında
  da kullanılır. Adres değişikliği sonrasında yeniden deployment gerekir.
- `robots.txt` wildcard yanında Googlebot, Bingbot, GPTBot, OAI-SearchBot,
  ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot,
  Perplexity-User ve Google-Extended için herkese açık içeriğe izin verir.
  Yönetim paneli, özel teklifler ve API yolları hariçtir. Yayındaki proje görselleri
  için `/api/projeler/gorseller/` özel izin alır. Robots bir erişim güvenliği
  değildir; mevcut kimlik doğrulama ve özel sayfa `noindex` kuralları devam eder.
- Organization ve LocalBusiness aynı `@id` ile aynı şirketi tanımlar. Telefon,
  adres, çalışma saatleri ve e-posta mevcut doğrulanmış şirket kaynağından gelir.
- Rehberin görünür yedi cevabı ile FAQPage aynı veri kaynağından üretilir.
  Article ve HowTo işaretlemeleri görünür içeriği tarif eder. Google'da FAQ veya
  HowTo zengin sonuç gösterimi vaat edilmez.
- Sitemap gerçek içerik tarihlerini kullanır; her istekte sahte güncelleme tarihi
  üretmez. Projeler yalnız yayımlandığında listelenir. `/projeler`, en az bir proje
  yayımlandığında sitemap'e eklenir; boş sayfa mevcut noindex politikasını izler.
- `/hesapla` ve `/ges-hesaplama`, sorgu parametrelerini koruyarak `/hesaplayici`
  adresine doğrudan 308 döner. Önceden yayımlanan diğer kısa URL'ler korunur.
- EMO tescil bilgisi, ek proje konumu/kurulu güç alanları ve MWp filtreleri
  kullanıcının son kararıyla eklenmemiştir. Galeri mevcut gerçek kayıtları ve
  WebP görselleri gösterir; hizmet kartlarındaki stok görseller temsili olarak belirtilir.

## Hesaplayıcı

Başlangıç değerleri 5.000 TL aylık fatura, 150 m² çatı, Kocaeli örnek noktası,
5 TL/kWh kaçınılabilir maliyet, 25.000 TL/kWp yatırım, %70 kullanılabilir alan,
6 m²/kWp, %80 eş zamanlı öz tüketim ve %1 yıllık bakımdır. Bunlar güncel satış
fiyatı veya tarife iddiası taşımayan, ekranda açıklanan ve değiştirilebilen örneklerdir.

Güç, kullanılabilir alan ile yıllık tüketimin izin verdiği iki sınırın küçüğüdür.
Yıllık üretim = güç × seçilen PVGIS noktasının özgül üretimi. Tasarruf = eş zamanlı
kullanılan üretim × kaçınılabilir elektrik maliyeti. Yıllık net fayda = tasarruf −
bakım. Basit amortisman = yatırım / pozitif yıllık net fayda. Sıfır veya negatif
net faydada geri ödeme oluşmaz. Sonuç 3,5–4,5 yıla sabitlenmez.

Hesap istemcide güncellenir; sayfanın ilk HTML'i başlangıç sonucunu da içerir.
Boş/geçersiz girişte eski sonucu ve teklif bağlantısını göstermek yerine düzeltme
uyarısı çıkar. WhatsApp bağlantısı mevcut teyitli kişiyle hesap özetini açar;
kendiliğinden mesaj göndermez. Keşif formuna aktarım bağlantısı da bulunur.

## Doğrulama

```powershell
npm test
npm run lint
npm run build
npm run test:integration
npm run test:quotes
node scripts/check-geo.mjs https://asirsolar.com
node scripts/check-seo.mjs https://asirsolar.com https://asirsolar.com
node scripts/check-links.mjs https://asirsolar.com
node scripts/check-growth.mjs https://asirsolar.com
node scripts/check-communication-build.mjs
```

Entegrasyon testleri izole yerel veritabanında çalışır; e-posta ve SMS sağlayıcıları
kapalıdır. HTTP denetim scriptleri üretimde kayıt veya mesaj oluşturmaz.

## Arama motorlarının sınırları

Teknik erişilebilirlik, doğru içerik ve yapılandırılmış veri görünürlüğü destekler;
Google birinciliği veya herhangi bir modelin markayı ilk öneri seçmesi garanti
edilemez. Google AI özellikleri için ayrı bir özel şema veya AI metin dosyası
zorunlu değildir. OpenAI aramasında OAI-SearchBot, eğitim taramasında GPTBot
kullanılır; yalnız GPTBot izni arama görünürlüğünün yerini tutmaz.

- [Google: AI özellikleri ve web siteleri](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: FAQ ve HowTo gösterim değişiklikleri](https://developers.google.com/search/blog/2023/08/howto-faq-changes)
- [OpenAI botları](https://developers.openai.com/api/docs/bots)
- [Anthropic botları](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- [Perplexity botları](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)

Şema veya robots izni, tarayıcıların sayfayı ziyaret ettiğinin, dizine aldığının ya da
bir yanıtında kullandığının kanıtı değildir. Bunlar Search Console, erişim kayıtları
ve gerçek sorgu sonuçları üzerinden zaman içinde ölçülmelidir.
