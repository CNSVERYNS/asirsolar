# Domain bağlanmadan SEO hazırlığı

10 Eylül 2026 tarihli öneri ekran görüntülerine göre uygulandı.

**Resmi yayın için ana kontrol listesi:** [YAYIN_ONCESI_KONTROL_LISTESI.md](YAYIN_ONCESI_KONTROL_LISTESI.md). Kullanıcı, Search Console ve diğer hazırlıkların gerçek domainle açılış öncesinde tamamlanmasını istedi. Her yeni form için iki mühendise de e-posta ve SMS teslimatı zorunlu yayın koşuludur; henüz tamamlanmadı.

## Sitede tamamlanan işler

- Tek merkezden kanonik adres: `NEXT_PUBLIC_SITE_URL`. Mevcut adres `https://asirsolar.vercel.app`; gerçek domain bağlanınca bu değer değiştirilip yeniden dağıtılır.
- Otomatik `/sitemap.xml` ve `/robots.txt`; yönetim ve API yolları taramaya kapalı. Yönetim sayfalarında ayrıca noindex var.
- Doğrulanmış unvan, adres, telefon, logo, iletişim kişileri ve altı hizmetten oluşan LocalBusiness / WebSite / Service bağlantıları. Hizmetler aynı işletme kimliğine referans verir.
- İletişim sayfasında ContactPage; rehberlerde Article ve BreadcrumbList. JSON-LD çıktısında HTML karakter kaçışı.
- Altı hizmet sayfasında teknik değerlendirme, kapsam ve görüşme hazırlığı.
- Çatı uygunluğu, izin/bağlantı ve geri ödeme rehberlerinde ayrıntılı içerik ve resmî kaynaklar. Bu üç içerikte gerçek değişiklik tarihi.
- Kullanıcının kendi değerleriyle çalışan, varsayımları açıklanan geri ödeme hesaplayıcısı.
- Gebze / Kocaeli yerel içeriği, tutarlı adres/telefon ve harita bağlantısı; önemli rehberlere iç bağlantılar.
- Boş proje arşivi noindex ve sitemap dışında; gerçek proje girilince otomatik olarak açılır. Stok görseller temsili olarak etiketlidir.
- Masaüstü, mobil ve iletişim sayfası için WhatsApp bağlantısı hazır; kullanıcı tarafından doğrulanan alıcı Onur Durak, `+905419243545`.

## Google Search Console

Vercel adresi bir **URL ön eki mülkü** olarak kullanılabilir; özel domain şart değildir.

1. Yetkili Google hesabıyla Search Console’a giriş yapın ve `https://asirsolar.vercel.app/` URL ön eki mülkünü ekleyin.
2. HTML etiketi doğrulamasında verilen `content` değerini Vercel production ortamına `GOOGLE_SITE_VERIFICATION` olarak ekleyin; etiketin tamamını yapıştırmayın.
3. Yeniden dağıtın. Ana sayfa kaynak kodunda `google-site-verification` meta etiketini kontrol edip Google’da doğrulayın.
4. `https://asirsolar.vercel.app/sitemap.xml` gönderin. URL Denetimi üzerinden ana sayfa, hizmetler ve üç ayrıntılı rehber için canlı URL testi çalıştırın; gerekiyorsa indeksleme isteyin.
5. Google’ın taraması/indekslemesi ve rapor oluşturması zaman alabilir. Site haritasının gönderilmesi indeks veya sıralama garantisi değildir.

Durum: Kullanıcının isteğiyle resmi yayın öncesi yapılacak işler arasına alındı. Doğrulama kodu henüz alınmadı ve sitemap Google’a gönderilmedi. Ayrıntılı kabul maddeleri ana kontrol listesinde.

## WhatsApp’ı etkinleştirme

10 Eylül 2026’da kullanıcı tarafından alıcı doğrulandı: **Onur Durak, +905419243545**. Furkan Cansever’in numarası WhatsApp için kullanılmayacak; yalnızca sunucu tarafındaki SMS bildirimleri için ana kontrol listesine kaydedildi.

- `NEXT_PUBLIC_WHATSAPP_PHONE`: ülke koduyla telefon, yalnızca rakamlar (Türkiye: `90` + 10 haneli numara).
- `NEXT_PUBLIC_WHATSAPP_NAME`: yönlendirilen mühendisin adı.
- İki değer Vercel production ortamında tanımlanıp yeniden dağıtılmalıdır. Bunlar web sayfasında yayımlanan bilgilerdir.
- Mevcut Vercel ayarları: `NEXT_PUBLIC_WHATSAPP_PHONE=905419243545`, `NEXT_PUBLIC_WHATSAPP_NAME=Onur Durak`.
- Yerel çalışma için `.env.local` kullanılabilir. Testlerde kullanılan örnek numaralar üretim ortamına taşınmamalıdır.
- Bağlantı WhatsApp konuşmasını ve hazır mesaj taslağını açar; kendiliğinden mesaj göndermez. Formdaki müşteri bilgileri bağlantıya eklenmez.

## İşletme profili ve gerçek proje kayıtları

- Google İşletme Profili bağlantısı, sahiplik erişimi ve doğrulanmış çalışma saatleri bekleniyor. Mevcut profili yönetmek tercih edilir; kontrol etmeden ikinci kayıt açmayın.
- Profilde marka adı, gerçek adres, sabit telefon, hizmetler ve mevcut web adresi siteyle tutarlı tutulmalıdır. Kategori mevcut Google seçenekleri ve gerçek faaliyet alanına göre seçilir.
- Çalışma saatleri, harita koordinatı, müşteri yorumu, puan, sertifika veya yetkili servis iddiası doğrulanmadan eklenmez.
- Gerçek proje için `data/projects.ts` alanlarını doldurun: proje adı, konum, sistem tipi, kapsam, kapasite (DC kWp / AC kW ayrımı), tarih, kısa açıklama ve yayımlama izni alınmış saha fotoğrafı.
- Fotoğrafın çekildiği projeyi ve ekipmanı doğrulayın. Tasarım/simülasyon ile ölçülmüş üretim verisini ayırın. Teknik değeri bilinmeyen alanı boş bırakın.
- Kaynak klasöründeki bina ekran görüntüsü, tamamlanmış proje ve kapasite kanıtı olarak kabul edilmedi.

## Gerçek domain bağlandığında

1. Domainin DNS ve TLS bağlantısını doğrulayın; tek bir tercih edilen ana adres belirleyin.
2. Vercel’de domaini bağlayın; `NEXT_PUBLIC_SITE_URL` ve `APP_ORIGIN` değerlerini aynı ana adresle güncelleyin, yeniden dağıtın.
3. Alternatif www/non-www ve eski yayın adreslerinden kalıcı 301/308 yönlendirmeyi, URL yollarını koruyarak kurun. Domain çalışmadan yönlendirme açmayın.
4. Kanonik adres, sitemap, robots, yapılandırılmış veri, sosyal paylaşım görseli, form/CRM ve yönlendirmeleri kontrol edin.
5. Search Console’da yeni domain mülkünü DNS ile doğrulayın; yeni sitemap’i gönderin, Google’ın desteklediği taşıma adımlarını takip edin. İşletme Profili web bağlantısını güncelleyin.

Vercel alt alan adı teknik indeksleme engeli değildir. Özel domain kalıcı marka adresi sağlar; tek başına sıralama garantilemez. Yapılandırılmış veri işletmeyi açıklamaya yardımcı olur; Google’ın zengin sonuç göstermesi garanti değildir. E-E-A-T için siteden hesaplanabilen bir Google puanı yoktur.

## Kontrol komutları

`npm run lint`, `npm test`, `npm run build`, `npm run test:integration`

Çalışan site için: `node scripts/check-seo.mjs https://asirsolar.vercel.app`

Kaynaklar: [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business), [Search Console doğrulama](https://support.google.com/webmasters/answer/9008080), [EPDK](https://epdk.gov.tr/Detay/Icerik/3-0-92-3/elektriklisanssiz-uretim), [SEDAŞ](https://www.sedas.com/Tr/icerik_lisanssiz-elektrik-uretimi_580), [JRC PVGIS](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/pvgis-5-user-manual_en).
