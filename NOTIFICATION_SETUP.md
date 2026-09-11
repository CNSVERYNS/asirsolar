# Form bildirimleri kurulumu

11 Eylül 2026. Gerçek domain gerekmez; mevcut `https://asirsolar.vercel.app` adresiyle çalışacak altyapı hazır. Henüz SMTP veya SMS sağlayıcı hesabı bağlanmadı ve gerçek teslimat doğrulanmadı.

## Alıcılar ve akış

| Alıcı | E-posta | SMS |
| --- | --- | --- |
| Onur Durak | onur.durak@asirsolar.com | +905419243545 |
| Furkan Cansever | furkan.cansever@asirsolar.com | +905431185861 |

WhatsApp yalnızca Onur’a yönlenir. SMS numaraları sunucu yapılandırmasındadır; yönetici oturumu dışında Furkan’ın numarası yayımlanmaz.

Her web formu tek veritabanı işlemiyle talep, geçmiş olayı ve dört bildirim kaydı oluşturur. Aynı gönderim anahtarı tekrar kullanılırsa ikinci kayıt oluşmaz. Etkin kanallarda gönderim, form yanıtının hemen ardından Next.js `after` ile başlar. Bir alıcının hatası diğerlerini engellemez. Telefonla veya panelden elle girilen talep web formu bildirimi oluşturmaz.

## Sağlayıcıları bağlama

1. Şirket posta sağlayıcısı, gönderici hesabı ve iki posta kutusuna erişim doğrulanır. SMTP değerleri yalnızca Vercel **Production** sunucu ortamına girilir: `CRM_SMTP_HOST`, `CRM_SMTP_PORT` (587 veya 465), `CRM_SMTP_USER`, `CRM_SMTP_PASSWORD`, `CRM_EMAIL_FROM`. SMTP TLS zorunludur.
2. Netgsm için REST v2 gönderim ve rapor bağdaştırıcısı hazırlandı; hesap açılmadı veya paket satın alınmadı. Kullanıcının sağlayıcısı farklıysa bu bağdaştırıcı değiştirilir. Netgsm kullanılacaksa API alt kullanıcı erişimi, gönderici başlığı ve bakiye doğrulanıp `CRM_SMS_PROVIDER=netgsm`, `CRM_NETGSM_USERCODE`, `CRM_NETGSM_PASSWORD`, `CRM_NETGSM_HEADER` girilir.
3. `APP_ORIGIN=https://asirsolar.vercel.app` olmalıdır. Bildirim bağlantıları HTTPS gerektirir. Parolalar/anahtarlar `NEXT_PUBLIC_` değişkenlerine, kaynak koduna veya bu belgeye yazılmaz.
4. Sağlayıcı doğrulamaları bitene kadar `CRM_EMAIL_ENABLED=false`, `CRM_SMS_ENABLED=false` kalır (eksik değer de kapalıdır). Hazır kanallar için değerler ayrı ayrı `true` yapılıp yeniden dağıtılır. Bu değişiklik eski `held` kayıtları topluca göndermez.
5. Bir kontrollü form ile **iki posta kutusu ve iki telefon** üzerinde gerçek teslimat doğrulanır. SMTP kabulü posta kutusuna teslim kanıtı değildir. SMS’de sağlayıcı kabulü ile telefona teslim ayrı gösterilir.

E-postada talep bilgileri ve müşteriye yanıt adresi bulunur. SMS yalnızca talep referansı ve giriş gerektiren CRM bağlantısını içerir; müşteri serbest metni ve iletişim bilgileri SMS’e aktarılmaz. SMS uzunluğu/Türkçe karakterler nedeniyle ücretlendirilen parça sayısı, seçilen başlık ve gerçek sağlayıcı hesabıyla kabul testinde kontrol edilir.

Netgsm isteği sabit HTTPS API adresine, yönlendirme izlenmeden ve zaman aşımıyla gönderilir. `referansID` kuyruk kaydının kimliğidir; bunun sağlayıcı tarafında mükerrer gönderimi kesin önlediği varsayılmaz. İç operasyon bildirimi için `iysfilter=0` kullanılır; bu uç nokta müşteriye pazarlama SMS’i göndermez.

## Otomatik görev

`supabase/operations/notification-cron.sql` mevcut Supabase projesinde yönetici rolüyle kurulur; normal uygulama göçünden ayrıdır. `pg_cron` ve `pg_net`, `POST /api/cron/bildirimler` adresini **iki dakikada bir** çağırır. Günlük Vercel görevi ikincil kontroldür; dakika ölçeğindeki işleyici Supabase’dedir. Zamanlayıcının canlı doğrulama sonucu ana kontrol listesine kaydedilir.

Vault’ta iki kayıt gerekir:

- `asir_crm_cron_secret`: Vercel Production `CRON_SECRET` ile aynı, rastgele gizli değer.
- `asir_crm_notification_url`: `https://asirsolar.vercel.app/api/cron/bildirimler`.

Cron SQL’i gizli değeri içermez, çalışma anında Vault’tan okur. HTTP istek kuyruğuna anonim, uygulama ve genel rollerin tablo erişimi kapatılır. Aynı isimle kurulum tekrarlanırsa ikinci görev oluşturulmaz. İstek kimliği alınması HTTP başarısı sayılmaz: Supabase görev geçmişi, `net._http_response` içindeki HTTP sonucu ve paneldeki son çalışma zamanı birlikte kontrol edilir.

Her genel çalışma kanalda en fazla dört gönderim ve kırk SMS raporu işler. Başarısız iş başına en fazla altı otomatik deneme; artan bekleme ve iki dakikalık görev aralığı uygulanır. İlk gönderimler talep bazında anında yapılır. Büyük kesinti sonrası kuyruğun boşalma süresi bu kapasiteye bağlıdır; yoğunluk artarsa parti boyutu, sağlayıcı limitleri ve Vercel süreleri birlikte yeniden değerlendirilir.

Görevi durdurmak için Supabase yöneticisi `SELECT cron.unschedule('asir-crm-notifications');` kullanabilir. Gönderimleri durdurmak için ayrıca her iki etkinleştirme bayrağını `false` yapıp yeniden dağıtın; günlük görev ve form sonrası gönderim de böyle durur. Daha önce kabul edilmiş SMS’lerin teslim raporları, sağlayıcı bilgileri mevcutsa sorgulanmaya devam eder.

## Panel ve hata yönetimi

`/admin/ayarlar` sağlayıcıların tanımlı/etkin durumunu ve son beş dakikada zamanlayıcı çalışmasını gösterir. Talep ayrıntısındaki **Ekip bildirimleri** bölümünde dört ayrı satır, deneme sayısı, güvenli hata kodu ve SMS sağlayıcı kimliği bulunur.

| Durum | Anlam ve işlem |
| --- | --- |
| `held` | Kanal kapalıyken kaydedildi. Etkinleştirmeden sonra yönetici talep üzerinden tek tek başlatabilir. |
| `pending` / `sending` | Sırada / gönderiliyor. Aynı kayıt eşzamanlı işleyicilerce ikinci kez alınamaz. |
| `sent` | E-posta sunucusu kabul etti; posta kutusunu ayrıca kontrol edin. |
| `accepted` | SMS sağlayıcısı kabul etti; teslim raporu bekleniyor. |
| `delivered` | Sağlayıcı raporunda mesaj kimliği ve alıcı eşleşti, teslim doğrulandı. Görünen zaman raporun bizim tarafımızdan doğrulandığı zamandır. |
| `failed` | Kesin hata. Geçici hata otomatik denenir; kalıcı hata için bağlantı/başlık/bakiye kontrolü ve elle tekrar gerekir. |
| `unknown` | Zaman aşımı, yarım kalmış gönderim veya kabul sonrası kayıt sorunu. Otomatik tekrar yapılmaz. Kimlik varsa rapor sorgulanır; yoksa sağlayıcı paneli ve alıcı kontrol edilir. |

Belirsiz bir bildirimi tekrar göndermeden önce yöneticinin **teslim edilmediğini doğrulaması** gerekir. Manuel işlem talep geçmişine yazılır. Gönderilmiş veya teslim edilmiş kayıt yeniden sıraya alınamaz. Geçiş öncesindeki bekleyen e-postalar tek seferlik göçle `held` durumuna alınır; mevcut üretim kuyruğu geçiş öncesi boştu.

## Yayın kabulü ve domain değişimi

- Yerel otomatik testler: 33 test; dört kalıcı kayıt, atomik geri alma, çift gönderim engeli, eşzamanlılık, SMTP alıcı hatası, zaman aşımı, Netgsm kabul/rapor eşleşmesi ve sınırlı tekrar.
- Üretim derlemesi, lint ve HTTP entegrasyonu geçti. 68 site rotası ve yönetici yetkileri kontrol edildi. Gerçek sağlayıcı yerine taklit servislerle yapılan testler teslimat kanıtı değildir.
- İki posta kutusu + iki telefonda teslimat, spam kontrolü, sağlayıcı hatası sonrası doğru tekrar ve son domain üzerinde aynı test, resmi açılıştan önce zorunludur.
- Gerçek domain taşınınca `APP_ORIGIN`, `NEXT_PUBLIC_SITE_URL` ve Vault’taki `asir_crm_notification_url` birlikte güncellenir. HTTP yönlendirmesine güvenilmez. Google, DNS ve içerik maddeleri ana kontrol listesindedir.

Resmî kaynaklar: [Netgsm API dokümanı](https://www.netgsm.com.tr/dokuman/), [Supabase zamanlanmış HTTP çağrıları](https://supabase.com/docs/guides/functions/schedule-functions), [Supabase Vault](https://supabase.com/docs/guides/database/vault), [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net), [Vercel Cron plan sınırları](https://vercel.com/docs/cron-jobs/usage-and-pricing).
