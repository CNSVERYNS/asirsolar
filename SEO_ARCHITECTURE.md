# Asır Solar teknik SEO ve dönüşüm mimarisi

23 Eylül 2026. Canonical: `https://www.asirsolar.com`. Bu değişiklik DB migration, provider ayarı veya gerçek email/SMS gönderimi gerektirmez.

## Mimari ve doğrulanmış içerik

Next.js 16 App Router / TypeScript korunur. Metin, metadata ve JSON-LD Server Components üzerinden gelir; hesaplayıcı, consent ve dialog küçük client sınırları içindedir. Tailwind 4 yalnız `tw:` önekli yeni yardımcı sınıflarda kullanılır; Preflight mevcut admin/form stillerini sıfırlamaz.

`data/company.ts` mevcut işletme kaydıdır. Kullanıcı Pazartesi–Cuma 08.00–17.00 saatlerini doğruladı. `data/business-evidence.ts` saatler, ileride doğrulanacak geo / fiyat aralığı / HTTPS sosyal profiller için tipli kaynaktır. Koordinat, fiyat aralığı ve sosyal profil bilinmediği için yayımlanmaz. **Sosyal bağlantıları bu adım sonunda kullanıcıya hatırlatın.**

Müşteri yorumu henüz yok. `VerifiedReviews` ve `reviewProperties` hazırdır ancak boş veri Review/AggregateRating üretmez. Gerçek proje, yayın izni, tarih ve puan gerekir. Proje başarı oranı müşteri puanı değildir.

`EnergySupplier` mevcut Schema.org sözlüğünde geçerli bir tür değildir; sahte `@type` yerine `LocalBusiness` ve ona bağlanan `Service` kullanılır. [Schema.org tür ağacı](https://schema.org/docs/full.html).

## Yapılandırılmış veri

`JsonLd.tsx` / `lib/json-ld.ts`, `schema-dts` Graph / WithContext tiplerini ve script içinden kaçışı sağlayan serileştirmeyi kullanır. `<`, `>`, `&`, Unicode satır ayraçları kaçırılır.

`lib/schema-builders.ts` / `lib/structured-data.ts`: işletme, WebSite, sekiz Service; görünür içerikle aynı kaynaktan FAQPage; katalogdan BreadcrumbList; altı görünür fabrika kurulum adımından HowTo; rehberlerde Article ve gerçek projelerde CreativeWork. İzinli değerlendirme gelirse Review/AggregateRating desteği hazırdır.

Google FAQ zengin sonuçlarını 7 Mayıs 2026'da, HowTo gösterimini 2023'te kaldırdı. Bu şemalar semantik amaçlıdır. İşletmenin kendi sitesindeki işletme yorumları Google yıldızı vaadi oluşturmaz. [Güncellemeler](https://developers.google.com/search/updates), [HowTo değişikliği](https://developers.google.com/search/blog/2023/08/howto-faq-changes), [Review kuralları](https://developers.google.com/search/docs/appearance/structured-data/review-snippet).

## Routing, metadata ve tarama

- `lib/site.ts`: mevcut canonical config, sayfaya özel OG/Twitter. Yalnız Türkçe içerik olduğundan hayali hreflang yok.
- `/og-image?path=...`: yalnız `lib/seo-catalog.ts` yolları veya DB'de yayımlanmış proje. 1200×630 PNG, mevcut logo, Türkçe destekli OFL font. Arbitrary URL fetch veya serbest kullanıcı başlığı yok. DB projesinin OG görseli no-store, yayından kaldırılınca 404.
- `/projeler/[slug]`: mevcut editoryal slug ve yayımlanmış admin projesi UUID yolu. Bu public proje UUID'sidir; müşteri/teklif UUID veya token değildir. Taslak/kaldırılmış proje 404.
- Sitemap: statik sayfa, hizmet, rehber, gerçek proje ve doğrulanmış yerel katalog; bilinen değişiklik tarihleri. `priority`/`changeFrequency` sıralama garantisi değildir.
- Robots: admin/API/özel teklif engelli, public proje görselleri için `/api/projeler/gorseller/` istisnası. Admin/teklif ayrıca noindex/no-store. Robots authorization yerine geçmez.

## Yerel OSB sayfaları

`/ges-kurulumu`, `/ges-kurulumu/kocaeli`, `/ges-kurulumu/kocaeli/gebze-osb` katalogda mevcut. `data/local-areas.ts` içine doğrulanmış içerik eklenmeden başka şehir/OSB üretilemez, bilinmeyen yol 404 verir.

Gebze OSB içeriği elektrik dağıtımı, ruhsatlandırma, tüketim profili ve teknik evrak hazırlığına odaklanır. Ortaklık, tamamlanmış yerel proje, kapasite veya müşteri uydurulmaz. Yeni bölge için yerel kaynak ve özgün bilgi gerekir; şehir adı değiştirerek toplu doorway üretmeyin. [GOSB elektrik](https://www.gosb.com.tr/en/services/infrastructure-services/electricity), [GOSB ruhsat](https://www.gosb.com.tr/hizmetler/ruhsatlandirma-hizmetleri), [Google spam politikaları](https://developers.google.com/search/docs/essentials/spam-policies).

## Hesaplayıcı ve CRO

`/ges-hesaplama` ve ana sayfa aynı `LazySolarEstimator` bileşenini kullanır; hesap kodu düğmeye basılınca yüklenir. Fatura, çatı alanı, bölge, birim elektrik/yatırım maliyeti ve dört gelişmiş varsayım düzenlenebilir. Hesap cihazda yapılır.

`data/solar-baselines.json`: PVGIS 5.3 / SARAH3, sekiz örnek koordinat, binaya montaj, güney, 30° eğim, %14 kayıp; GET ile 23 Eylül 2026'da alındı. İl ortalaması değildir. Güncelleme: `node scripts/update-solar-baselines.mjs`; tüm istekler doğrulanmadan dosya yazılmaz. [PVGIS API](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/api-non-interactive-service_en).

Güç = min(kullanılabilir alan / alan-kWp, yıllık tüketim / özgül üretim). Tasarruf = öz tüketim × kaçınılabilir maliyet. Bakım çıkarılır. Amortisman yatırım / net yıllık faydadır; fayda pozitif değilse geri ödeme yoktur. Satış geliri, finansman, vergi, enflasyon, tarife artışı, degradasyon veya ekipman yenilemesi varsayılmaz.

5 TL/kWh ve 25.000 TL/kWp açıkça örnek değerlerdir, güncel tarife/teklif değildir. CO₂: ETKB 2023 dağıtım tüketim faktörü 0,465 kg CO₂/kWh, yalnız öz tüketimle ilişkili; yaşam döngüsü/karbon kredisi değildir. [ETKB kaynak](https://enerji.gov.tr/evced-cevre-ve-iklim-elektrik-uretim-tuketim-emisyon-faktorleri).

CTA mevcut WhatsApp alıcısına taslak açar veya `/iletisim` formuna hesap özeti aktarır. Otomatik gönderim yok. Validasyon, consent, idempotency, `/api/talepler` korunur. Query mesajı sınırlandırılır/kontrol karakterleri çıkarılır/React ile kaçırılır. Query'ler ölçüm araçlarına aktarılmamalıdır.

Mobil alt bar arama, WhatsApp ve hızlı teklif içerir. ExitIntent yalnız masaüstü/farede 45 saniye ve 250px okuma sonrası üstten çıkışta, başka dialog/form odağı yokken açılır; oturum başına bir kez. Native dialog Escape/kapatma/odak dönüşü destekler. CTA mevcut formu açar. Harita yalnız düğmeyle yüklenir.

## Performans ve erişilebilirlik

Archivo next/font latin/latin-ext self-host, metriği ayarlı fallback. Görsel boyutları ayrılmıştır; hero statik poster, preload ve responsive sizes kullanır. LCP görselini hydration bekleyen blur geçişinden ayırdık; blurDataURL, alt bölümdeki statik montaj fotoğrafında kullanılır. Video geciktirilir; saveData, düşük hız, reduced-motion, sekme/görünürlük gözetilir. Video ve kayan şerit duraklatılabilir. Reveal sarmalayıcısı server bileşenidir; içerik açılırken her blok için ayrı observer/state/animasyon yüklenmez.

Public içerik RSC/SSG, gerçek proje sayfaları görünürlüğü anında uygulamak için dinamik. Hesaplayıcı/dialog/marketing lazy; map opt-in. Semantik başlıklar, skip link/odak hedefi, etiketli input, klavye odağı ve responsive bar. Otomatik kontroller tam WCAG sertifikası değildir; ekran okuyucu/gerçek cihaz kontrolleri sürdürülmeli.

Font/medya self-host olduğundan Google Fonts preconnect yok. Marketing preconnect/dns-prefetch yalnız izinle ve gerçek ID varsa. Next chunk preload'unu yönetir; değişen hash'li bundle'a elle `modulepreload` yazılmaz. Paket Next kılavuzuna göre `worker` App Router'da desteklenmediğinden `afterInteractive` kullanılır.

100 Lighthouse / LCP<1,2s / CLS=0 / INP<50ms hedefleri garanti değildir. Lighthouse laboratuvar ölçümüdür, INP saha etkileşimi ister. Search Console/CrUX mobil 75. yüzdelik izlenmeli; geliştirme sunucusunda performans ölçülmemeli.

## Env ve consent

Hiçbir Vercel env değiştirilmedi, gerçek tracking ID eklenmedi.

| Env | Amaç | Gizli mi / durum |
| --- | --- | --- |
| NEXT_PUBLIC_SITE_URL | Canonical: https://www.asirsolar.com | Hayır / mevcut |
| APP_ORIGIN | Server/form origin | Hayır / mevcut |
| GOOGLE_SITE_VERIFICATION | Search Console meta kodu | Hayır / mevcut |
| NEXT_PUBLIC_WHATSAPP_PHONE | Onaylı WhatsApp alıcısı | Hayır / mevcut |
| NEXT_PUBLIC_WHATSAPP_NAME | Alıcı adı | Hayır / mevcut |
| NEXT_PUBLIC_GTM_ID | Opsiyonel GTM container | Hayır / yeni, boşken kapalı |
| NEXT_PUBLIC_GA_ID | Opsiyonel doğrudan GA4 | Hayır / yeni, boşken kapalı |
| NEXT_PUBLIC_META_PIXEL_ID | Opsiyonel Meta Pixel | Hayır / yeni, boşken kapalı |

Yeni üç public env istenen ölçüm araçlarını seçmek içindir. GTM varsa doğrudan GA/Pixel kapalı; çift kurulum önlenir. Local/Preview boş; Production yalnız doğru hesap, privacy/consent ve vendor panel ayarları kontrol edilince girilip rebuild edilir. CRM env'lerine dokunulmaz.

Eski Anladım takip izni sayılmaz; `asir-solar-tracking-consent-v1` ayrı izindir. Ret hatırlanır, geri çekmede reload ile scriptler kaldırılır; eski vendor çerezleri tarayıcı ayarlarından silinebilir. Admin/teklif marketing render etmez.

Doğrudan GA page_view pathname ile, query/hash/dış referrer olmadan gider. **GA4 panelinde Enhanced Measurement history/page/form otomatik olaylarını kapatın**: send_page_view:false tek başına history olaylarını kapatmaz. GTM'de özel yol/query/form bilgisi toplamayın; dış container içeriği repodan doğrulanamaz. Meta autoConfig kapalı; query/hash varsa açık PageView gönderilmez, otomatik olayları Meta panelinde de kapatın. Müşteri verisini custom tag'e taşımayın. [Google pageview kontrolü](https://developers.google.com/analytics/devguides/collection/ga4/views).

## Güvenlik

Genel HTML CSP self kaynaklar, object none, frame-ancestors none, production'da unsafe-eval yok. Statik Next hydration için public script CSP unsafe-inline içerir; nonce kadar sıkı değildir. Tüm statik sayfaları dinamik yapmanın performans maliyeti yerine bu tradeoff açıkça korunur.

`proxy.ts` yalnız admin/teklif için kriptografik per-request nonce/strict-dynamic/no-store üretir. Next script nonce'u request CSP'den alır. Session/token authorization değişmedi. API dosyaları genel HTML CSP'den ayrılır; teklif eklerinin `sandbox; default-src 'none'` politikası korunur.

HSTS max-age=31536000; includeSubDomains/preload yok. X-Frame-Options DENY, nosniff, strict-origin-when-cross-origin; özel yollarda no-referrer. Secret/DB modülleri client'a import edilmez.

## Test, yayın ve rollback

`npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`, `npm run test:integration`, `npm run test:quotes`.

Düşük bellek Windows unit alternatifi: `node --wasm-num-compilation-tasks=1 --test --liftoff-only --no-wasm-tier-up --test-concurrency=1 tests/*.test.mjs`.

HTTP integration: ayrı yerel DB, kapalı provider, boş credentials; hiçbir gerçek gönderim yok. Proje publish/unpublish sayfa/OG/sitemap gizliliği ve quote dosya sandbox'ı ayrıca doğrulanır.

- `node scripts/check-seo.mjs https://www.asirsolar.com`
- `node scripts/check-growth.mjs https://www.asirsolar.com`
- `node scripts/check-communication-build.mjs`

İlk iki komut GET-only metadata/schema/sitemap/başlık/OG/404/nonce kontrolüdür; son komut build secret taramasıdır.

Rollback: SEO commit'ini `git revert` edip normal deployment veya Vercel önceki Ready deployment'a rollback. DB/env migration yok; lead, quote, token, history ve notification korunur.

## Uygulama doğrulaması — 23 Eylül 2026

- Unit suite: 85/85, gerçek provider çağrıları mock.
- ESLint, TypeScript, production build başarılı (88 statik çıktı).
- CRM HTTP: 77 rota ve form persistence/auth/idempotency; proje publish/unpublish detay/OG/sitemap kontrolleri başarılı.
- Quote HTTP: token, dosya sandbox, kabul/revizyon, erişim kontrolü başarılı; provider'lar kapalı.
- GET-only SEO: izole DB ile 68 sitemap sayfası; ek local route/OG/başlık/CSP/nonce kontrolleri başarılı.
- Client artifact taraması: 31 çıktı, provider secret veya kod sızıntısı bulunmadı.
- Tarayıcı: 390px mobil hesap, sonuçtan form ön dolumu, WhatsApp taslak URL'si; gerçek talep gönderilmedi. OG 1200×630 görsel gözle doğrulandı.
- Lighthouse 13.5.0 mobil simülasyonu, yerel production build, 12:14 UTC: performans 86, erişilebilirlik 100, best-practices 100, SEO 100; FCP 1,1s, LCP 3,7s, TBT 200ms, CLS 0. Hedeflenen 100 performans/LCP<1,2s bu ölçümde sağlanmadı. TBT, INP değildir. Bu ölçüm production saha verisi veya tüm sitenin WCAG belgesi değildir.
- Standart Lighthouse CLI Windows geçici profil temizliğinde EPERM verdi; ayrı audit profiliyle çalışan programatik tekrar başarıyla tamamlandı. Ham raporlar `.local-tools` içinde yereldir, dağıtıma dahil değildir.
- `88f0ef3` Vercel production Ready; canlı GET denetiminde 71 sitemap sayfası ve tüm yeni OG/local/security kontrolleri geçti. Production kayıtlarındaki yayımlanmış projeler yerel boş test DB'sinden farklıdır.
- Canlı `https://www.asirsolar.com` mobil Lighthouse, 12:18 UTC: performans **94**, erişilebilirlik **100**, best-practices **100**, SEO **100**; FCP 1,3s, LCP 2,5s, TBT 200ms, CLS 0. INP saha ölçümü yapılmadı; 100 performans / LCP<1,2s hedefi henüz karşılanmıyor.
- İletişim sayfası ayrı yerel mobil ölçüm: performans 96, diğer kategoriler 100. Form başarı/kapalı durum başlığı da h1→h2 sırasına uyar; görünüm `.h3` tipografi sınıfıyla korunur.
