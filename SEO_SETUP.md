# Asır Solar SEO yayın ve işletim

Canonical domain: **https://www.asirsolar.com**. `asirsolar.com` www adresine yönlenir. Güncel uygulama, test, env, kaynaklar ve rollback: [SEO_ARCHITECTURE.md](SEO_ARCHITECTURE.md).

## Doğrulanmış bilgiler

- Mevcut gerçek şirket unvanı, adresi, telefonu, `iletisim@asirsolar.com` ve mühendis profilleri korunur.
- Çalışma saatleri: Pazartesi–Cuma 08.00–17.00, kullanıcı tarafından doğrulandı.
- Sosyal profil bağlantıları henüz verilmedi; bu adım sonunda kullanıcıya hatırlatılacak.
- Müşteri yorumu/puanı henüz yok; görünür yorum veya rating şeması uydurulmaz.
- Gerçek projeler admin Projeler ekranından yayımlanabilir. Fotoğraf/yayın izni ve teknik değerler doğrulanmalıdır; özel müşteri teklifleri public projeye dönüştürülmez.

## Search Console ve Google İşletme Profili

Kod değişikliği Google hesabını doğrulamaz veya sitemap göndermez. Önce mevcut mülk/sahipliği kontrol edin, ikinci profil açmayın.

1. Search Console'da mevcut `asirsolar.com` domain mülkünü kullanın; yoksa Google'ın verdiği DNS TXT ile yetkili hesapta doğrulayın. www URL-prefix alternatifi için mevcut `GOOGLE_SITE_VERIFICATION` meta kodu desteklenir.
2. `https://www.asirsolar.com/sitemap.xml` gönderin. Ana sayfa, hizmetler, gerçek projeler, hesaplama ve doğrulanmış yerel sayfalarda URL Inspection çalıştırın.
3. İndeksleme, canonical seçimi, mobil Core Web Vitals ve sorguları izleyin. Sitemap/şema indeks veya sıralama garantisi değildir.
4. Mevcut Google İşletme Profili'nde gerçek adres, telefon, web sitesi ve çalışma saatlerini eşitleyin. Doğrulanmış ofis harita noktası ve profil bağlantısı gelmeden yeni geo/sameAs eklemeyin.
5. Sosyal profil bağlantılarını `data/business-evidence.ts` içine ekleyin. Gerçek müşteri yorumları için yayın iznini kaydedin.

## Ölçüm ve dönüşüm

WhatsApp alıcısı mevcut doğrulanmış Onur Durak hesabıdır; link mesaj taslağı açar, otomatik göndermez. GTM/GA4/Meta public ID'leri boşken kapalıdır. Provider panelindeki otomatik olaylar ve privacy/consent koşulları denetlenmeden açmayın. [Detaylı kurulum](SEO_ARCHITECTURE.md#env-ve-consent).

## GET-only kontroller

`node scripts/check-seo.mjs https://www.asirsolar.com`

`node scripts/check-growth.mjs https://www.asirsolar.com`

Bu komutlar form veya email/SMS göndermez.

Kaynaklar: [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business), [Search Console doğrulama](https://support.google.com/webmasters/answer/9008080), [Google SEO rehberi](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).
