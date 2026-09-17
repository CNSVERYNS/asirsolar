# Asır Solar talep ve iş takibi

Web formu `/api/talepler` üzerinden talebi kaydeder. `/admin`, Onur Durak ve Furkan Cansever'in ortak çalışma alanıdır. Giriş adresi `/admin/giris`.

Talep detayından sürümlü teklif hazırlama, özel dosya paylaşımı ve müşteri onay/revizyon takibi: [QUOTE_CRM_SETUP.md](QUOTE_CRM_SETUP.md). Yeni teklif gönderimi `CRM_QUOTES_SEND_ENABLED` ile bağımsız ve varsayılan kapalıdır; mevcut form bildirimleri kendi ayarlarıyla çalışmayı sürdürür.

## Üretim bağlantısı — 16 Eylül 2026

- Vercel: `yunus-projeler/asirsolar`, Next.js, Node.js 24, üretim dalı `main`.
- Site: `https://www.asirsolar.com`; panel: `https://www.asirsolar.com/admin`.
- Supabase: mevcut `asirsolar` projesi, `htudwfcazvwzutboheeb`, Ohio (`us-east-2`).
- Bağlantı, `asir_crm` şemasının sahibi olan ayrı `asir_crm_app` hesabını ve transaction pooler'ı kullanır. Bu hesabın süper kullanıcı, rol oluşturma veya veritabanı oluşturma yetkisi yoktur. Mevcut `postgres` parolası değiştirilmemiştir.
- `DATABASE_URL` ve Supabase CA sertifikası `DATABASE_SSL_CA` olarak yalnızca Vercel Production ortamındadır; sertifika ve sunucu adı doğrulanır. Yerel `.env.local` canlı veritabanına geçirilmemiştir.
- Onur ve Furkan için üretim hesapları oluşturulmuştur. İlk giriş bilgileri bu bilgisayardaki Git tarafından hariç tutulan `.local-tools/admin-access-*.txt` dosyalarındadır. İlk girişte parolaları değiştirin.
- ZeptoMail REST entegrasyonu hazır; Send Mail Token bağlantısı ve onaylı gerçek gönderim testi bekliyor. Ortak adres `iletisim@asirsolar.com`. E-posta/SMS kapalıyken talepler ve bildirim işleri panelde korunur. Güncel adımlar: [ZOHO_NETGSM_KURULUM.md](ZOHO_NETGSM_KURULUM.md).

## Akış

- Web sitesi talepleri müşteri kaydı, takip numarası, geçmiş, müşteri teşekkür e-postası ve iki mühendise ayrı e-posta/SMS olmak üzere beş bildirim işi oluşturur. Tekrarlı gönderim ikinci kayıt oluşturmaz.
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
| `APP_ORIGIN` | `https://www.asirsolar.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.asirsolar.com` |
| `CRON_SECRET` | En az 32 karakter rastgele değer; sensitive |
| `CRM_EMAIL_PROVIDER` | `zeptomail`; eski SMTP uyumluluğu için `smtp` |
| `CRM_ZEPTOMAIL_TOKEN` | ZeptoMail ham Send Mail Token; sensitive, yalnızca Production |
| `CRM_EMAIL_FROM` | `ASIR SOLAR GÜNEŞ ENERJİSİ SİSTEMLERİ <iletisim@asirsolar.com>` |
| `CRM_EMAIL_REPLY_TO` | `iletisim@asirsolar.com` |
| `CRM_EMAIL_ENABLED`, `CRM_SMS_ENABLED` | Gerçek test için ayrı onay verilene kadar `false` |
| `CRM_SMTP_HOST`, `CRM_SMTP_PORT`, `CRM_SMTP_USER`, `CRM_SMTP_PASSWORD` | Yalnızca eski SMTP yolu; ZeptoMail REST bunları kullanmaz |

Ortam değişikliklerinden sonra yeniden deploy gerekir. Vercel'de `DATABASE_URL` olmadan yerel disk yedeğine geçilmez: talep ve panel uçları açık hata verir, kayıt varmış gibi başarı göstermez.

Preview ortamını canlı müşteri veritabanına bağlamayın. Preview CRM gerekiyorsa ayrı Supabase test projesi ve kullanıcıları kullanın. Uygulama kendi Vercel deployment adresini de Origin kontrolünde kabul eder.

Domain bağlanınca `APP_ORIGIN` ve `NEXT_PUBLIC_SITE_URL` değerlerini yeni HTTPS adresiyle değiştirin, Vercel Domains üzerinden DNS bağlantısını tamamlayıp yeniden yayınlayın. Diğer panel adresleri değişmez.

## E-posta bildirimi

Talep, geçmiş ve beş bildirim işi tek veritabanı işlemiyle kaydedilir. Provider hatası talebi kaybettirmez. Seçili sağlayıcı config eksikse veya gönderim kapalıysa kuyruk held bekler; eski held kayıtlar ayar açılınca topluca gönderilmez.

Etkin kanalda ilk deneme form yanıtından sonra başlar. Supabase görevi iki dakikada bir retry/rapor kontrolü yapar; günlük Vercel cron ikincildir. Her çalışmada kanal başına en fazla dört gönderim işlenir. Kayıt üzerinden ayrı yeniden deneme vardır. Ayrıntılar: [NOTIFICATION_SETUP.md](NOTIFICATION_SETUP.md).

API/SMTP kabulü gelen kutusuna kesin teslim anlamına gelmez. Belirsiz kabul/timeout unknown kalır ve otomatik tekrarlanmaz. Message-ID ve client_reference korelasyon için kullanılır; mutlak provider idempotency garantisi değildir. Gerçek teslimat testi açık kullanıcı onayı bekler.

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

Birim testleri geçici PostgreSQL kullanır; ZeptoMail/SMTP/Netgsm çağrıları mock edilir. PGlite bellek kullanımı için test dosyaları sırayla çalışır. HTTP entegrasyonu 3001 portunda ayrı yerel sunucu ve DB ile form/panel akışını kontrol eder; gerçek ileti göndermez. `node scripts/check-communication-build.mjs` client build'de secret/provider kodu sızıntısını kontrol eder.

Teknik kaynaklar: [Supabase bağlantı seçenekleri](https://supabase.com/docs/guides/database/connecting-to-postgres), [Vercel bağlantı havuzları](https://vercel.com/kb/guide/connection-pooling-with-functions).
