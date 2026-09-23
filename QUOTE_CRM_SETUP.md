# CRM teklif yönetimi

Güncel kısa referanslar ve satış panosu: [CRM_PIPELINE_SETUP.md](CRM_PIPELINE_SETUP.md). Kullanıcının doğruladığı mevcut production durumunda `CRM_EMAIL_ENABLED=true`, `CRM_QUOTES_SEND_ENABLED=true`, `CRM_SMS_ENABLED=false`; teklif E2E testi yapılmıştır. Pipeline geliştirmesi bu ayarları değiştirmez ve gerçek mesaj göndermez.

## Mimari ve mevcut akış

`/api/talepler`, form doğrulaması, Origin kontrolü, DB tabanlı hız sınırları ve idempotency anahtarıyla lead + geçmiş + mevcut beş bildirim işini aynı transaction içinde kaydeder. Bu sözleşme korunmuştur. Manuel lead oluşturma bildirim göndermez.

Teklif modülü `lib/quotes` içindedir. Admin uçları `/api/admin/teklifler`, müşteri uçları `/api/teklif/[token]`; tüm admin işlemleri mevcut oturum doğrulamasını kullanır. Mutasyonlarda Origin, alan/boyut ve hız kontrolleri vardır. Veritabanı kodu, `lib/quotes/server.ts` sunucu sınırı üzerinden sayfalara bağlanır. Tarayıcı yalnızca açıkça seçilmiş DTO'ları alır.

Panel: `/admin/talepler/{leadId}` → **Teklif Hazırla** → `/admin/talepler/{leadId}/teklifler/yeni`. Kaydedilmiş teklif: `/admin/talepler/{leadId}/teklifler/{quoteId}`. Bu URL'ler yalnızca admin içindir; müşteriye `/teklif/{token}` gider.

## Veritabanı ve migration

Migration: `supabase/migrations/202609170001_quotes.sql`. Mevcut tablo/kayıt silinmez; özel `asir_crm` şemasına altı tablo eklenir:

| Tablo | Amaç |
| --- | --- |
| `quote_threads` | Ticari teklif zinciri, lead bağlantısı ve korunan eski thread numarası |
| `quotes` | V1/V2 sürümleri, müşteri bilgisi anlık kopyası, fiyat, para birimi, KDV, tarih, mesaj, durum ve zaman damgaları |
| `quote_attachments` | Sürüme ait özel BYTEA dosyaları, MIME, güvenli ad, boyut ve SHA-256 |
| `quote_tokens` | 256 bit rastgele bağlantıların yalnızca SHA-256 özetleri |
| `quote_dispatches` | İdempotent gönderim komutları |
| `quote_events` | Admin/müşteri/sistem aktörüyle sıralı teklif geçmişi |

Güncel görünen numara `quotes.quote_number` alanında `ASR-TKLF-N` biçimindedir; `quote_reference_seq` üretir. Her sürüm ayrı numara alır, aynı `thread_id` altında V1/V2 ilişkisi korunur. Talep numarası bağımsız `lead_reference_seq` ile `ASR-TLP-N` olur. `quote_number_seq` ve eski thread numarası yalnızca geçmiş/rolling-deploy uyumluluğu için korunur. `edit_version` taslaktaki eşzamanlı düzenlemeleri kontrol eder. `202609180001_pipeline_references.sql` backfill'i ve rollback ayrıntıları yeni pipeline dokümanındadır.

Gönderilmiş müşteri bilgisi, fiyat, içerik ve dosyaları DB trigger'ları da korur. Kimlik, zincir ve ticari sürüm değiştirilemez. Eski sürüm korunur. V2 taslakken V1 açıktır; V2 gönderildiğinde V1'in bağlantıları iptal edilir. Kabul edilmiş tekliften doğrudan revizyon oluşturulamaz. Taslak oluşturulduktan sonra V1 kabul edilirse V2 gönderimi durdurulur.

Mevcut `email_outbox` ve `sms_outbox` tablolarına nullable `quote_id`, `dispatch_id`, `quote_token` eklenir. Mevcut lead bildirim benzersizliği `quote_id IS NULL` koşullu indeksleriyle aynen korunur. Teklif bildirimleri sürüm/gönderim/alıcı/amaçla ayrılır. `email_outbox.purpose` ek değerleri: `quote_customer`, `quote_accepted`, `quote_revision`.

Tüm yeni tablolarda RLS açık, PUBLIC/anon/authenticated erişimi kapalıdır. Şemayı Supabase Data API exposed schemas listesine eklemeyin. Mevcut `asir_crm_app` bağlantısı yeterlidir; yeni secret gerekmez.

Sadece bu migration'ı uygulamak için güvenilir terminalde mevcut DB ortamını kullanın:

```powershell
node scripts/quote-migrate.mjs          # salt okunur şema kontrolü
node scripts/quote-migrate.mjs --apply  # yalnızca yeni migration, mevcut kayıtların korunduğu kontrol edilir
```

Komut parolaları veya müşteri verilerini basmaz, hesap oluşturmaz, bildirim worker'ını çağırmaz. Migration kısa DDL kilitleri için 5 saniye lock timeout kullanır. Kilit alınamazsa transaction geri alınır; düşük trafikte tekrar çalıştırın. Önce migration, sonra yeni uygulama deployment'ı gerekir. `crm:setup` yeni yerel kurulumlarda bu migration'ı da uygular.

Güncel sürüm ayrıca pipeline migration'ını gerektirir: `node scripts/pipeline-migrate.mjs --apply`. Production'da tüm eski migration'ları tekrar çalıştırmak yerine bu hedefli komutu kullanın.

## Durumlar ve CRM eşlemesi

`draft` → `sent` → `viewed` → `accepted` veya `revision_requested`.

Geçerlilik tarihinin İstanbul saat dilimindeki gün sonundan sonra yanıt bekleyen sürümler `expired` olur; okuma sırasında ve cron bakımında kontrol edilir. Admin `revoked` yapabilir. `rejected` veri modelinde ayrılmıştır; bu sürümde müşteriye ayrı red butonu sunulmaz.

`sent`, teklifin paylaşıma açıldığını ve seçili bildirim işlerinin kaydedildiğini gösterir; teslim edildiği anlamına gelmez. Admin her kanalın held/pending/sent/failed/unknown durumunu ayrı görür. İlk görüntülenme görünür tarayıcı sayfasından POST ile kaydedilir; GET yapan basit link tarayıcıları view sayılmaz. JavaScript çalıştıran güvenlik tarayıcılarını insan ziyaretinden kesin ayıramayız. Refresh yalnızca son görüntülenmeyi günceller; ilk view olayı bir kez yazılır, e-posta üretilmez.

Mevcut lead enum'u değiştirilmez. Yeni/ön görüşme/teklif aşamalarında gönderim `proposal`, müşteri onayı `won` yapar. Uygulamada/tamamlanmış kayıtlar geriye alınmaz. Revizyon ve view teklif durumu/geçmişinde görünür. Mevcut CRM tutarı TRY olduğundan yalnızca TRY teklifler `leads.quote_cents` alanını günceller; USD/EUR tutarları çevrilmeden kendi teklifinde gösterilir.

Müşteri onayı **Teklif Onayı**dır; nitelikli elektronik imza veya ödeme değildir. Onay dialog'u gerektirir. Müşteri eylemleri aynı sürümün kilidi altında atomiktir; ikinci onay yeni olay/bildirim oluşturmaz. Ham IP veya user-agent ayrıca saklanmaz; mevcut hash'li rate-limit yaklaşımı korunur.

## E-posta ve SMS

Yeni sağlayıcı yazılmamıştır. Mevcut `flushEmailOutbox` → ZeptoMail/SMTP ve `flushSmsOutbox` → Netgsm kullanılır. Mevcut `processNotifications`, yanıt sonrası `after()` ve cron retry düzeni korunur.

Teklif ve dispatch/outbox kayıtları commit olduktan sonra sağlayıcı denenir. Sağlayıcı hatası teklif/lead'i silmez. Çift tıklama gönderim idempotency anahtarı ve sürüm kilidiyle tek dispatch üretir. Açıkça tekrar gönderme yeni dispatch'tir; bekleyen/belirsiz iş varken engellenir, bir dakikalık ek aralık vardır. Timeout/şüpheli kabul `unknown` kalır, otomatik tekrarlanmaz. Önce alıcı/sağlayıcı kontrolü, sonra admin onaylı retry gerekir. Mutlak dış sağlayıcı exactly-once garantisi yoktur.

Müşteri e-postası mevcut logolu email shell'ini kullanır: müşteri, proje, teklif numarası/sürüm, tutar/KDV, geçerlilik, mesaj ve **Teklifi İncele** bağlantısı; plain text alternatifi vardır. From mevcut `CRM_EMAIL_FROM`, Reply-To mevcut `CRM_EMAIL_REPLY_TO` değerinden gelir. Unicode ad ve header-injection koruması mevcut provider katmanındadır; HTML alanları escape edilir.

PDF e-postaya eklenmez. Teklif özeti mailde görünür; kanonik belge kaynağı erişimi iptal edilebilir teklif sayfasıdır. Böylece büyük ek, provider sınırı ve eski belgenin denetimsiz dağıtımı azaltılır.

SMS: `ASIR SOLAR: {proje} projeniz için teklifiniz hazır. Teklifinizi inceleyin: https://.../teklif/{token}`. Harici link kısaltıcı kullanılmaz. Uzunluk ve Türkçe karakterlere göre çok parçalı SMS ücretlendirmesi olabilir. Netgsm/config kapalıysa SMS `held` kalır; e-posta/teklif etkilenmez. Aktivasyon eski held işleri kendiliğinden açmaz; admin bildirim bazında yeniden dener. Geçersiz telefon seçili SMS kanalında doğrulama hatası verir; Türkiye cep telefonu gerekir.

Kabul/revizyon için Onur (`onur.durak@asirsolar.com`) ve Furkan (`furkan.cansever@asirsolar.com`) adına ayrı e-posta işleri oluşturulur; panelde gerçek kayıt bağlantısı vardır. Teklif modülü kapalıysa bu işler de held kalır.

## Bağlantı ve dosya güvenliği

- Token `crypto.randomBytes(32)` → 43 karakter base64url; kimlik, lead numarası veya sıralı sayı içermez. Lookup yalnızca SHA-256 hash ile yapılır. Public DTO raw quote/lead/thread kimliği, telefon, e-posta, teslimat veya admin alanlarını içermez.
- **Linki Kopyala** yeni bağımsız bir bağlantı üretir. Hash saklanır; eski bağlantılar aynı sürüm iptal edilene kadar çalışır. Hash'ten eski token geri çıkarılmaz. Sürüm başına 256 bağlantı sınırı vardır; iptal tüm bağlantıları kapatır.
- Önemli saklama ayrımı: durable e-posta/SMS retry için gönderilecek URL'nin raw token'ı özel outbox'ın `quote_token` alanında geçici olarak tutulur. Bu, hash-only erişim tablosundan farklıdır. Hiçbir DTO/log'a dahil edilmez; başarı, kalıcı hata, belirsiz sonuç, iptal ve süre sonu temizlenir. Held/retryable işler gönderilene/iptale/süre sonuna kadar payload tutar. Manuel retry yeni token üretir. DB yedekleri de hassastır. Yeni şifreleme secret'ı uydurulmamıştır.
- Bağlantıya sahip kişi erişebilir; sadece ilgili kişilere paylaşılmalıdır. URL'ler erişim loglarında görülebileceğinden log erişimi/saklama politikasını sınırlayın; uygulama token loglamaz. Sayfa/API no-store, noindex/nofollow, no-referrer; sitemap dışıdır. Harici izleme veya iframe/PDF embed yoktur.
- Dosyalar mevcut proje görselleri yaklaşımı gibi özel PostgreSQL BYTEA'dadır. Yeni public bucket, tahmin edilebilir açık URL veya storage secret'ı yoktur. Limit 3 MB/dosya, 5 dosya/sürüm; Vercel request sınırının altında kalır. Çok sayıda/büyük belge için ileride ayrı private object storage değerlendirilebilir.
- MIME allowlist ve içerik kontrolü uygulanır. PNG/JPEG decode + metadata temizliğiyle yeniden kodlanır. PDF imzası/sonu ve bilinen aktif içerik adları kontrol edilir; **antivirüs garantisi değildir**. Güvenilir şirket dokümanları yüklenmelidir. Tüm belgeler attachment olarak, `nosniff` ve sandbox header'ıyla indirilir; filename sanitize edilir.
- Admin dosya uçları oturum ister; public dosya uçları token + aynı sürüme bağlı dosya ister. İptal/expired sürüm dosyaları müşteriye açılmaz. Gönderilmiş dosyalar DB seviyesinde değiştirilemez/silinemez; revizyona ayrı kopyalanır.
- Devam eden bir provider HTTP isteği geri alınamaz; iptal kalan işleri durdurur ve mesaj ulaşmış olsa bile link erişimini kapatır. Önceden indirilmiş dosya kopyaları geri alınamaz.

## Ortam değişkenleri

Yeni tek değişken **`CRM_QUOTES_SEND_ENABLED`**: secret değildir; varsayılan `false`. Mevcut e-posta/SMS anahtarları web formunu da kontrol ettiği için teklif yayınını bağımsız ve güvenli açmak amacıyla gereklidir. Client'a env olarak taşınmaz; sadece boolean yetenek bilgisi gider.

| Exact değişken | Amaç / değer kaynağı | Secret | Ortam |
| --- | --- | --- | --- |
| `CRM_QUOTES_SEND_ENABLED` | Varsayılan `false`; mevcut Production kullanıcı tarafından `true` olarak aktifleştirildi | Hayır | Preview/Development kapalı; Production mevcut değer korunur |
| `APP_ORIGIN` | Public linkler: `https://www.asirsolar.com` | Hayır | Production; testte ayrı HTTPS origin |
| `DATABASE_URL` | Mevcut Supabase pooler | Evet | Production; yerel testte ayrı DB |
| `DATABASE_SSL_CA` | Mevcut Supabase TLS CA | Hayır | Mevcut sunucu ortamı |
| `CRM_EMAIL_PROVIDER` | Mevcut `zeptomail` (veya uyumlu `smtp`) | Hayır | Production |
| `CRM_EMAIL_ENABLED` | Mevcut kanal anahtarı; bu görev değiştirmez | Hayır | Production; testte kapalı/mock |
| `CRM_EMAIL_FROM` | `ASIR SOLAR GÜNEŞ ENERJİSİ SİSTEMLERİ <iletisim@asirsolar.com>` | Hayır | Production |
| `CRM_EMAIL_REPLY_TO` | `iletisim@asirsolar.com` | Hayır | Production |
| `CRM_ZEPTOMAIL_TOKEN` | Mevcut ZeptoMail token; bu görev değiştirmez | Evet | Yalnızca mevcut Production |
| `CRM_SMTP_HOST`, `CRM_SMTP_PORT`, `CRM_SMTP_USER`, `CRM_SMTP_PASSWORD` | Yalnızca mevcut SMTP uyumluluğu | Parola evet | Kullanılıyorsa mevcut sunucu ortamı |
| `CRM_SMS_PROVIDER`, `CRM_SMS_ENABLED` | Mevcut `netgsm` ve kanal anahtarı | Hayır | Production; testte kapalı/mock |
| `CRM_NETGSM_USERCODE`, `CRM_NETGSM_PASSWORD`, `CRM_NETGSM_HEADER` | Mevcut Netgsm API hesabı/onaylı başlık | Parola evet | Netgsm hazır olduğunda Production |
| `CRON_SECRET` | Mevcut worker yetkilendirmesi | Evet | Production; ayrı test değeri |

Mevcut `NEXT_PUBLIC_SITE_URL` genel site içindir; token veya provider secret'ı eklenmez. Testler ayrıca mevcut `CRM_LOCAL_DATABASE`/`CRM_LOCAL_PATH` ile izole PGlite kullanır. Gerçek DB ve provider secret'larını Preview'a taşımayın. Gönderim flag'inin tek başına açılması yetmez; seçili kanalın kendi config'i de geçerli olmalıdır.

## Testler ve production kontrol listesi

```powershell
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run test:integration
npm run test:quotes
node scripts/check-communication-build.mjs
node scripts/check-quotes.mjs https://www.asirsolar.com # deploy sonrası sadece GET
```

Unit testleri gerçek provider `fetch`/SMTP çağrılarını mock eder. HTTP testleri yalnızca localhost 3001/3002, ayrı DB, boş provider credentials ve `CRM_EMAIL_ENABLED=false`, `CRM_SMS_ENABLED=false` kullanır. HTTPS linkler oluşturulsa da test isteği canlı domaine yapılmaz. Belleği sınırlı bilgisayarda build ve PGlite suite'ini aynı anda çalıştırmayın; gerekirse build için process-only `CIRCLE_NODE_TOTAL=2` kullanın.

İlk kurulum doğrulaması: 63 unit test geçti. Yerel Windows ortamında PGlite/WebAssembly derleyici belleğini sınırlamak için aynı suite `node --wasm-num-compilation-tasks=1 --test --test-concurrency=1 tests/*.test.mjs` ile çalıştırıldı; bu bir production env değişikliği değildir. Teklif HTTP testi, mevcut CRM/form HTTP testi ve yerel tarayıcıda taslak/önizleme/müşteri revizyon akışı ayrı test veritabanlarında doğrulandı. Production migration uygulandı; mevcut lead/e-posta/SMS kayıtlarının korunduğu ve altı yeni tabloda RLS açık, anonim erişim kapalı olduğu kontrol edildi. Production'da test teklifi veya bildirim işi oluşturulmadı.

- [ ] Supabase yedekleme/geri yükleme düzeni doğrulandı.
- [x] Salt okunur şema audit'i ve migration uygulaması doğrulandı.
- [x] Testler, build ve client secret taraması geçti.
- [ ] Yeni deployment Ready, admin yetki ve public 404/head kontrolleri yapıldı.
- [x] İlk release kapalı yapıldı; kullanıcı sonraki production E2E testini ve gönderimin açıldığını doğruladı.
- [ ] Onur/Furkan panelde bir taslağı, dosyayı, tutar ve alıcı özetini inceledi.
- [ ] Gerçek e-posta için ayrıca kullanıcı onayı alındı.
- [ ] Kontrollü alıcıyla e-posta testi yapıldı; From/Reply-To/özet/link incelendi.
- [ ] Kabul/revizyon internal bildirimleri kontrollü test edildi.
- [ ] Netgsm hazır olduğunda SMS için ayrıca onaylı test yapıldı.

Production'da gönderim kapalıyken taslak/file/önizleme ve admin geçmişi kullanılabilir; `Teklif Gönder` pasiftir ve API/worker da aynı sınırı uygular. Bu görevde gerçek e-posta/SMS gönderilmez.

## Rollback

Önce `CRM_QUOTES_SEND_ENABLED=false` ve yeni deployment: sadece teklif gönderimi durur, mevcut web formları çalışır. Mevcut `CRM_EMAIL_ENABLED`/`CRM_SMS_ENABLED` değerlerini kapatarak çalışan formu etkilemeyin.

Eski kod deployment'ına geri dönecekseniz **önce** yeni quote worker'larının bitmesini bekleyin, quote `sending` satırlarının sıfır olduğunu doğrulayın; ardından yalnızca teklif işlerini iptal edin. Eski worker quote purpose'larını bilmez; pending/failed quote işi bırakmak yanlış şablonla gönderime yol açabilir.

```sql
BEGIN;
-- Önce her iki tablodaki quote_id IS NOT NULL AND status='sending' sayısı 0 olmalı.
UPDATE asir_crm.email_outbox SET status='cancelled',retryable=false,quote_token=NULL
 WHERE quote_id IS NOT NULL AND status IN ('held','pending','failed','unknown');
UPDATE asir_crm.sms_outbox SET status='cancelled',retryable=false,quote_token=NULL
 WHERE quote_id IS NOT NULL AND status IN ('held','pending','failed','unknown');
COMMIT;
```

Sonra eski uygulama deployment'ını geri alın. Yeni tabloları, geçmişi, trigger'ları veya indeksleri silmeyin; migration additive kalır. Mevcut lead'lerin durumunu/tutarını topluca geri çevirmeyin. Public quote sayfası eski deployment'ta bulunmayacağından müşterilere açılmış bağlantılar geçici olarak çalışmaz. Yeniden ileri deploy sonrası iptal edilmiş işler otomatik açılmaz; tek tek incelenir. Tam veri geri dönüşü yalnızca planlı yedek geri yükleme işlemiyle yapılmalıdır.
