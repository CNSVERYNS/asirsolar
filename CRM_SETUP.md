# Asır Solar talep ve iş takibi

Web formu `/api/talepler` üzerinden talebi kaydeder. `/admin`, Onur Durak ve Furkan Cansever'in ortak çalışma alanıdır. Giriş adresi `/admin/giris`.

## Üretim bağlantısı — 10 Eylül 2026

- Vercel: `yunus-projeler/asirsolar`, Next.js, Node.js 24, üretim dalı `main`.
- Site: `https://asirsolar.vercel.app`; panel: `https://asirsolar.vercel.app/admin`.
- Supabase: mevcut `asirsolar` projesi, `htudwfcazvwzutboheeb`, Ohio (`us-east-2`).
- Bağlantı, `asir_crm` şemasının sahibi olan ayrı `asir_crm_app` hesabını ve transaction pooler'ı kullanır. Bu hesabın süper kullanıcı, rol oluşturma veya veritabanı oluşturma yetkisi yoktur. Mevcut `postgres` parolası değiştirilmemiştir.
- `DATABASE_URL` ve Supabase CA sertifikası `DATABASE_SSL_CA` olarak yalnızca Vercel Production ortamındadır; sertifika ve sunucu adı doğrulanır. Yerel `.env.local` canlı veritabanına geçirilmemiştir.
- Onur ve Furkan için üretim hesapları oluşturulmuştur. İlk giriş bilgileri bu bilgisayardaki Git tarafından hariç tutulan `.local-tools/admin-access-*.txt` dosyalarındadır. İlk girişte parolaları değiştirin.
- SMTP sağlayıcısı henüz yapılandırılmamıştır. Talepler panelde saklanır; e-posta bildirimleri kuyrukta bekler. Kendi alan adına geçiş ayrıca yapılacaktır.

## Akış

- Web sitesi talepleri otomatik müşteri kaydı, takip numarası, işlem geçmişi ve iki ekip bildirimi oluşturur. Aynı gönderimin bağlantı hatası nedeniyle tekrarlanması ikinci kayıt oluşturmaz.
- Telefon, WhatsApp, e-posta, referans ve diğer kanallar elle kaydedilir. E-posta gelen kutusu ve WhatsApp hesabı okunmaz.
- Aşamalar: yeni talep, ön görüşme, teklif gönderildi, onaylandı, uygulamada, tamamlandı veya reddedildi. Red nedeni zorunludur.
- Sorumlu kişi, takip tarihi, öncelik, teklif tutarı, görüşme notları ve arşiv yönetilebilir. İki kullanıcı aynı kaydı düzenlerse eski sürümün kaydedilmesi engellenir.
- Liste 30 saniyede bir güncellenir. Liste ve aşama panosu 40 kayıtlık sayfalar kullanır; pano mevcut sayfadaki kayıtları gösterir.

## Yerel kurulum — Node.js 24

```powershell
npm ci
npm run crm:setup
npm run dev
```

`DATABASE_URL` yokken PostgreSQL'in PGlite sürümü `.data/postgres` altında çalışır. Bu klasör GitHub'a veya Vercel'e gönderilmez. Aynı yerel veritabanını birden çok süreç açmamalı: `crm:setup` çalıştırmadan önce geliştirme sunucusunu durdurun. Testler ayrı bir veritabanı kullanır.

Kurulum, yalnızca `onur.durak@asirsolar.com` ve `furkan.cansever@asirsolar.com` hesaplarını oluşturur. Rastgele ilk parolalar terminale basılmaz; yolu belirtilen `.local-tools/admin-access-*.txt` dosyasına yazılır. İlk girişten sonra Hesabım sayfasında değiştirin. Mevcut hesaplar yeniden çalıştırmada korunur.

```powershell
# Sadece bu hesabın parolasını sıfırlar ve oturumlarını kapatır:
npm run crm:setup -- --reset --email=onur.durak@asirsolar.com
```

Yerel ve Supabase hesapları ayrı veritabanlarında tutulur. Yerel ilk parolalar otomatik olarak Supabase'e taşınmaz.

## Supabase

1. Bu site için bir Supabase projesi oluşturun/seçin. Connect bölümündeki **Transaction pooler** bağlantısını kullanın (6543). Parolayı URI içinde doğru biçimde kodlayın.
2. `.env.local` içinde `DATABASE_URL` tanımlayın. Yalnızca sunucuda kullanılır; `NEXT_PUBLIC_` öneki eklemeyin. Uzak bağlantılarda TLS sertifikası doğrulanır. Gerekirse Supabase'in CA sertifikasını `DATABASE_SSL_CA` olarak verin.
3. `npm run crm:setup` komutu `supabase/migrations/202609090001_crm.sql` dosyasını uygular ve iki hesabı oluşturur. Veritabanına erişebilen güvenilir bir ortamda, bir kez çalıştırın; Vercel build adımına eklemeyin. Migration tekrar çalıştırılabilir ve mevcut kayıtları silmez.
4. Uygulama `asir_crm` isimli özel şemayı kullanır. Bu şemayı Supabase Data API'nin exposed schemas listesine **eklemeyin**. Tablolarda RLS etkindir, anonim ve genel kullanıcı erişimi kapalıdır. Sunucu bağlantısı şema sahibine aittir; panel erişimini sunucu uçları ayrıca doğrular.

Bu sürüm Supabase PostgreSQL kullanır; hesaplar uygulamanın özel şemasındadır. Supabase Auth için herkese açık kayıt oluşturulmaz.

## Vercel

Repo: `CNSVERYNS/asirsolar`, üretim dalı `main`. Proje: `yunus-projeler/asirsolar`. `vercel.json` Next.js framework ayarını içerir. Node.js 24 kullanılmalıdır.

Vercel > Settings > Environment Variables, **Production**:

| Değişken | Değer / amaç |
| --- | --- |
| `DATABASE_URL` | Supabase transaction pooler URI; sensitive |
| `DATABASE_SSL_CA` | Gerekirse Supabase CA sertifikası |
| `APP_ORIGIN` | `https://asirsolar.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | `https://asirsolar.vercel.app` |
| `CRON_SECRET` | En az 32 karakter rastgele değer; sensitive |
| `CRM_SMTP_HOST`, `CRM_SMTP_PORT` | E-posta sağlayıcısının SMTP adresi; 587/TLS veya 465 |
| `CRM_SMTP_USER`, `CRM_SMTP_PASSWORD` | SMTP kimliği; parola sensitive |
| `CRM_EMAIL_FROM` | Sağlayıcının doğruladığı gönderici adresi |

Ortam değişikliklerinden sonra yeniden deploy gerekir. Vercel'de `DATABASE_URL` olmadan yerel disk yedeğine geçilmez: talep ve panel uçları açık hata verir, kayıt varmış gibi başarı göstermez.

Preview ortamını canlı müşteri veritabanına bağlamayın. Preview CRM gerekiyorsa ayrı Supabase test projesi ve kullanıcıları kullanın. Uygulama kendi Vercel deployment adresini de Origin kontrolünde kabul eder.

Domain bağlanınca `APP_ORIGIN` ve `NEXT_PUBLIC_SITE_URL` değerlerini yeni HTTPS adresiyle değiştirin, Vercel Domains üzerinden DNS bağlantısını tamamlayıp yeniden yayınlayın. Diğer panel adresleri değişmez.

## E-posta bildirimi

Talep, görüşme geçmişi ve bildirim kuyruğu tek veritabanı işlemiyle kaydedilir. E-posta hatası talebi kaybettirmez. SMTP ayarları yoksa kuyruk bekler; panel bunu açıkça gösterir.

Gönderim form yanıtından sonra denenir. Bekleyen bildirimler panel listesi yenilendiğinde ve her gün 06:00 UTC'deki yetkili Vercel cron çağrısında tekrar denenir. Bir çağrı en fazla iki bildirim işler. Hatalarda artan bekleme süresi uygulanır. Müşteri kaydından elle yeniden deneme de mümkündür. Daha sık, kesintisiz bildirim için planın desteklediği cron sıklığı veya ayrı bir kuyruk çalışanı gerekir.

SMTP kabulü, alıcının gelen kutusuna kesin teslim anlamına gelmez. Süreç SMTP kabulünden hemen sonra kesilirse nadiren aynı bildirim tekrar iletilebilir; sabit Message-ID kullanılır. SPF/DKIM ve gönderici doğrulaması e-posta sağlayıcısında yapılmalıdır.

## Güvenlik, yedek ve veri yönetimi

- Parolalar salt ile scrypt kullanılarak saklanır. Oturum tokenlarının yalnızca SHA-256 özeti veritabanındadır. Oturumlar 12 saat sürer; HttpOnly/SameSite çerezi üretimde Secure'dür.
- API'ler sunucuda yetki, Origin, veri boyutu ve alan doğrulaması uygular. Giriş/form hız sınırları veritabanında tutulur. Vercel'in proxy IP başlığı kullanılır; başka sunucuda yalnızca güvenilir proxy varsa `CRM_TRUST_PROXY=true` ayarlayın.
- Yönetim sayfaları indekslenmez ve önbelleğe alınmaz. Her iki kullanıcı tüm kayıtları görebilir ve yönetebilir; işlemlerde kullanıcı adı tutulur.
- Supabase projesinin yedekleme politikasını seçilen plana göre etkinleştirin; düzenli dışa aktarma ve geri yükleme denemesi yapın. Arşivleme silme işlemi değildir. Saklama süresi sonunda silme talepleri şu an yetkili veritabanı yöneticisince ele alınır.
- KVKK, gizlilik ve çerez metinleri mevcut projeden gelen taslaklardır. Veri saklama süresi, hizmet sağlayıcıları ve veri işleme süreçleri şirkete göre tamamlanmalıdır.
- `.env*`, `.data`, `.local-tools`, `.vercel`, yedekler ve ilk parola dosyaları repoya yüklenmez.

## Doğrulama

```powershell
npm test
npm run lint
npm run build
npm run test:integration
```

Birim testleri geçici PostgreSQL kullanır; SMTP bir test alıcısıyla taklit edilir, gerçek e-posta gönderilmez. Entegrasyon testi 3001 portunda ayrı üretim sunucusu açar; gerçek form → panel akışını, erişim kontrollerini, e-posta kuyruğunu ve mevcut sayfa/medya davranışını kontrol eder. Görsel tarayıcı incelemesi bu komutların kapsamında değildir.

Teknik kaynaklar: [Supabase bağlantı seçenekleri](https://supabase.com/docs/guides/database/connecting-to-postgres), [Vercel bağlantı havuzları](https://vercel.com/kb/guide/connection-pooling-with-functions).
