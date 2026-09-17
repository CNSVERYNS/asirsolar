# Form bildirimleri kurulumu

16 Eylül 2026. Canlı site `https://www.asirsolar.com`; kök domain buraya yönlenir. Zoho Mail Lite 10 GB, ortak `iletisim@asirsolar.com` kutusu ve ZeptoMail domain doğrulamaları kullanıcı tarafından tamamlandı. Site ZeptoMail REST gönderimine hazır; token bağlantısı ve ayrı onaylı gerçek transactional/SMS testleri bekliyor. Güncel durum ve exact env adları: [Zoho / Netgsm kurulumu](ZOHO_NETGSM_KURULUM.md).

## Alıcılar ve akış

| Alıcı | E-posta | SMS |
| --- | --- | --- |
| Onur Durak | onur.durak@asirsolar.com | +905419243545 |
| Furkan Cansever | furkan.cansever@asirsolar.com | +905431185861 |

WhatsApp yalnızca Onur’a yönlenir. SMS numaraları sunucu yapılandırmasındadır; yönetici oturumu dışında Furkan’ın numarası yayımlanmaz.

Her web formu tek veritabanı işlemiyle talep, geçmiş olayı ve beş bildirim kaydı oluşturur: müşteriye bir teşekkür e-postası, iki mühendise birer e-posta ve SMS. Aynı gönderim anahtarı tekrar kullanılırsa ikinci kayıt oluşmaz. Etkin kanallarda gönderim, form yanıtının hemen ardından Next.js `after` ile başlar. Bir alıcının hatası diğerlerini engellemez. Telefonla veya panelden elle girilen talep web formu bildirimi oluşturmaz. `email_outbox.purpose` alanı `customer_receipt` ve `team` gönderimlerini ayırır; eski kayıtlar ekip bildirimi olarak kalır, geçmiş müşterilere teşekkür e-postası eklenmez.

## Sağlayıcıları bağlama

1. Production `CRM_EMAIL_PROVIDER=zeptomail`, `CRM_EMAIL_FROM=Asır Solar İletişim <iletisim@asirsolar.com>`, `CRM_EMAIL_REPLY_TO=iletisim@asirsolar.com` kullanır. Agent'ın ham Send Mail Token'ı yalnızca Production secret `CRM_ZEPTOMAIL_TOKEN` alanına girilir. REST endpoint sabittir; Agent Alias env'si yoktur. Önceki SMTP değişkenleri yalnızca `CRM_EMAIL_PROVIDER=smtp` uyumluluğu için korunur; ZeptoMail seçiliyken eksik token SMTP'ye düşmez.
2. Netgsm için REST v2 gönderim ve rapor bağdaştırıcısı hazırlandı; hesap açılmadı veya paket satın alınmadı. Kullanıcının sağlayıcısı farklıysa bu bağdaştırıcı değiştirilir. Netgsm kullanılacaksa API alt kullanıcı erişimi, gönderici başlığı ve bakiye doğrulanıp `CRM_SMS_PROVIDER=netgsm`, `CRM_NETGSM_USERCODE`, `CRM_NETGSM_PASSWORD`, `CRM_NETGSM_HEADER` girilir.
3. `APP_ORIGIN=https://www.asirsolar.com` olmalıdır. Bildirim bağlantıları HTTPS gerektirir. Parolalar/anahtarlar `NEXT_PUBLIC_` değişkenlerine, kaynak koduna veya bu belgeye yazılmaz.
4. Bu görevde `CRM_EMAIL_ENABLED=false`, `CRM_SMS_ENABLED=false` kalır. Kullanıcıdan e-posta ve SMS için ayrı açık gerçek test onayı alınmadan açılmaz. Onay sonrasında hazır kanal `true` yapılıp yeniden dağıtılır; bu yeni formların gönderimini de açar. Eski `held` kayıtlar topluca gönderilmez.
5. Ayrı test onaylarından sonra kontrollü form ile **müşterinin teşekkür e-postası, iki mühendis posta kutusu ve iki telefon** üzerinde gerçek teslimat doğrulanır. API/SMTP kabulü posta kutusuna teslim kanıtı değildir. SMS’de sağlayıcı kabulü ile telefona teslim ayrı gösterilir.

Mühendis e-postasında talep bilgileri ve müşteriye yanıt adresi bulunur. Müşteri teşekkür e-postasında referans ve şirket yanıt adresi vardır; form serbest metni, mühendis bilgileri ve özel panel bağlantısı bulunmaz. HTML içerik güvenli biçimde kaçırılır ve alıcı tek adres nesnesi olarak gönderilir. SMS, kullanıcının isteğiyle müşterinin adını, proje türünü ve giriş gerektiren CRM bağlantısını içerir; açıklama, telefon ve e-posta SMS’e aktarılmaz. SMS uzunluğu/Türkçe karakterler nedeniyle ücretlendirilen parça sayısı, seçilen başlık ve gerçek sağlayıcı hesabıyla kabul testinde kontrol edilir.

Netgsm isteği sabit HTTPS API adresine, yönlendirme izlenmeden ve zaman aşımıyla gönderilir. `referansID` kuyruk kaydının kimliğidir; bunun sağlayıcı tarafında mükerrer gönderimi kesin önlediği varsayılmaz. İç operasyon bildirimi için `iysfilter=0` kullanılır; bu uç nokta müşteriye pazarlama SMS’i göndermez.

## Otomatik görev

`supabase/operations/notification-cron.sql` mevcut Supabase projesinde yönetici rolüyle kurulur; normal uygulama göçünden ayrıdır. `pg_cron` ve `pg_net`, `POST /api/cron/bildirimler` adresini **iki dakikada bir** çağırır. Günlük Vercel görevi ikincil kontroldür; dakika ölçeğindeki işleyici Supabase’dedir. Zamanlayıcının canlı doğrulama sonucu ana kontrol listesine kaydedilir.

Vault’ta iki kayıt gerekir:

- `asir_crm_cron_secret`: Vercel Production `CRON_SECRET` ile aynı, rastgele gizli değer.
- `asir_crm_notification_url`: `https://www.asirsolar.com/api/cron/bildirimler`.

Cron SQL’i gizli değeri içermez, çalışma anında Vault’tan okur. Vault gizli değerleri anonim rollere ve CRM veritabanı rolüne kapalıdır. Supabase’in sahip olduğu `net` tablolarında genel SQL yetkileri vardır; bunlar uygulama göçüyle değiştirilemez. `net` şeması Data API’ye açılmamalı; istek kuyruğunu veya Vault’u okuyan genel API fonksiyonu oluşturulmamalıdır. Aynı isimle kurulum tekrarlanırsa ikinci görev oluşturulmaz. İstek kimliği alınması HTTP başarısı sayılmaz: Supabase görev geçmişi, `net._http_response` içindeki HTTP sonucu ve paneldeki son çalışma zamanı birlikte kontrol edilir.

Her genel çalışma kanalda en fazla dört gönderim ve kırk SMS raporu işler. Başarısız iş başına en fazla altı otomatik deneme; artan bekleme ve iki dakikalık görev aralığı uygulanır. İlk gönderimler talep bazında anında yapılır. Büyük kesinti sonrası kuyruğun boşalma süresi bu kapasiteye bağlıdır; yoğunluk artarsa parti boyutu, sağlayıcı limitleri ve Vercel süreleri birlikte yeniden değerlendirilir.

Görevi durdurmak için Supabase yöneticisi `SELECT cron.unschedule('asir-crm-notifications');` kullanabilir. Gönderimleri durdurmak için ayrıca her iki etkinleştirme bayrağını `false` yapıp yeniden dağıtın; günlük görev ve form sonrası gönderim de böyle durur. Daha önce kabul edilmiş SMS’lerin teslim raporları, sağlayıcı bilgileri mevcutsa sorgulanmaya devam eder.

## Panel ve hata yönetimi

`/admin/ayarlar` sağlayıcıların tanımlı/etkin durumunu ve son beş dakikada zamanlayıcı çalışmasını gösterir. Talep ayrıntısındaki **Talep bildirimleri** bölümünde beş ayrı satır, müşteri/ekip etiketi, deneme sayısı, güvenli hata kodu ve SMS sağlayıcı kimliği bulunur. Eski taleplerde yalnızca o sırada oluşturulan bildirimler görünür.

| Durum | Anlam ve işlem |
| --- | --- |
| `held` | Kanal kapalıyken kaydedildi. Etkinleştirmeden sonra yönetici talep üzerinden tek tek başlatabilir. |
| `pending` / `sending` | Sırada / gönderiliyor. Aynı kayıt eşzamanlı işleyicilerce ikinci kez alınamaz. |
| `sent` | E-posta sunucusu kabul etti; posta kutusunu ayrıca kontrol edin. |
| `accepted` | SMS sağlayıcısı kabul etti; teslim raporu bekleniyor. |
| `delivered` | Sağlayıcı raporunda mesaj kimliği ve alıcı eşleşti, teslim doğrulandı. Görünen zaman raporun bizim tarafımızdan doğrulandığı zamandır. |
| `failed` | Kesin hata. Geçici hata otomatik denenir; kalıcı hata için bağlantı/başlık/bakiye kontrolü ve elle tekrar gerekir. |
| `unknown` | Zaman aşımı, yarım kalmış gönderim veya kabul sonrası kayıt sorunu. Otomatik tekrar yapılmaz. Kimlik varsa rapor sorgulanır; yoksa sağlayıcı paneli ve alıcı kontrol edilir. |

ZeptoMail için 429 retryable, kesin 4xx failed; 5xx/timeout/bozuk başarı yanıtı unknown olarak tutulur. Ham provider cevabı veya Authorization kaydedilmez. E-posta kuyruk kimliği `client_reference` olarak gönderilir ve sağlayıcı loglarında korelasyon için kullanılabilir; provider idempotency garantisi sayılmaz. Ayrı request ID için yeni DB migration eklenmedi.

Belirsiz bir bildirimi tekrar göndermeden önce yöneticinin **teslim edilmediğini doğrulaması** gerekir. Manuel işlem talep geçmişine yazılır. Gönderilmiş veya teslim edilmiş kayıt yeniden sıraya alınamaz. Geçiş öncesindeki bekleyen e-postalar tek seferlik göçle `held` durumuna alınır; mevcut üretim kuyruğu geçiş öncesi boştu.

## Yayın kabulü ve domain değişimi

- 44 yerel otomatik test geçti: beş kalıcı kayıt, atomik geri alma, çift gönderim engeli, eşzamanlılık, SMTP uyumluluğu, ZeptoMail başarılı/başarısız/eksik token akışları, timeout/429/5xx, Netgsm hata izolasyonu, HTML ve header güvenliği.
- Üretim build'i, lint, ayrı TypeScript kontrolü ve yerel HTTP entegrasyonu geçti. 67 site rotası kontrol edildi; sentetik secret canary ile 23 client artifact tarandı. Gerçek provider veya production form testi yapılmadı; mock testleri gerçek teslimat kanıtı değildir.
- Müşteri teşekkür e-postası + iki mühendis posta kutusu + iki telefonda teslimat, spam kontrolü, sağlayıcı hatası sonrası doğru tekrar ve son domain üzerinde aynı test, bildirimlerin kabulü için gerekir.
- Gerçek domain taşınınca `APP_ORIGIN`, `NEXT_PUBLIC_SITE_URL` ve Vault’taki `asir_crm_notification_url` birlikte güncellenir. HTTP yönlendirmesine güvenilmez. Google, DNS ve içerik maddeleri ana kontrol listesindedir.

Resmî kaynaklar: [Netgsm API dokümanı](https://www.netgsm.com.tr/dokuman/), [Supabase zamanlanmış HTTP çağrıları](https://supabase.com/docs/guides/functions/schedule-functions), [Supabase Vault](https://supabase.com/docs/guides/database/vault), [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net), [Vercel Cron plan sınırları](https://vercel.com/docs/cron-jobs/usage-and-pricing).
