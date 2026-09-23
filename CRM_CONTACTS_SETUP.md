# CRM kişi rehberi

`/admin/crm` artık ad soyad, şirket, telefon, e-posta ve adres tutan kişi rehberidir. Kanban, sürükle-bırak, satış kolonları ve parasal özet bu ekrandan kaldırılmıştır. `/admin` altındaki eski pano seçeneği de kaldırılmış; menü adı **Talepler** olmuştur. Talep ve teklif süreçleri kendi ekranlarında devam eder.

## Kullanım

- Ad soyada veya şirkete göre alfabetik liste; sunucudan 25 kayıtlık sayfalar.
- Ad, şirket, telefon, e-posta ve adres içinde arama. `%` ve `_` gibi arama karakterleri SQL jokeri olarak değerlendirilmez.
- Yeni kişi ekleme; mevcut kişinin iletişim bilgilerini düzenleme. Yalnızca ad soyad zorunludur.
- Kişi penceresinin altındaki kapalı **İlgili talepler** bölümü mevcut talep detayına gider. Son 50 bağlantı gösterilir; diğer kayıtlar Talepler ekranından erişilebilir.
- Rehber düzenlemesi geçmiş talep veya gönderilmiş tekliflerin müşteri bilgilerini değiştirmez. Kişi eklemek talep, teklif veya bildirim oluşturmaz.

## Veritabanı ve geçiş

Migration: `supabase/migrations/202609230001_contacts.sql`.

| Tablo | Amaç |
| --- | --- |
| `asir_crm.contacts` | Kişi bilgileri, düzenleme sürümü, oluşturan/güncelleyen yönetici ve zaman |
| `asir_crm.contact_keys` | Normalize ad + telefon/e-posta eşleşmeleri ve manuel oluşturma isteklerinin idempotency anahtarları |
| `asir_crm.lead_contacts` | Bir kişinin birden fazla talebiyle bağlantısı; talep kimliği tekil |

Geçiş `created_at, id` sırasıyla mevcut taleplerden kişi oluşturur. Aynı normalize ad ve telefon (telefon yoksa e-posta) tekrar eden talepleri tek kişiyle eşleştirir. Yalnızca ortak telefon veya şirket üzerinden farklı kişiler birleştirilmez. Türkiye telefonlarında `0`, `90`, `0090` önekleri aynı numaraya eşleşir. Ad/telefon/e-posta bilgisi aynı olan farklı gerçek kişiler otomatik ayırt edilemez; böyle bir kayıt varsa yönetici incelemesi gerekir.

Eski taleplerde adres alanı bulunmadığı için adres boş bırakılır. Aynı kişi için en eski kaydın bilgileri başlangıç değeri olur. Yeniden çalıştırma ve yeni form kayıtları, sonradan elle düzeltilmiş kişi bilgilerini ezmez. Eski ad/telefon eşleştirmeleri saklanır.

Lead INSERT tetikleyicisi kişi bağlantısını aynı veritabanı işlemi içinde kurar. Backfill ve tetikleyici kurulumu tek transaction içinde; `lock_timeout=5s`, migration advisory lock ve kısa süreli lead yazma kilidiyle uygulanır. Mevcut lead/quote UUID, ASR referansları, sayaçlar, tokenlar, dosyalar ve outbox kayıtları değiştirilmez. Eşzamanlı kişi oluşturma identity advisory lock + unique key ile korunur. Düzenleme `version` üzerinden çakışma kontrolü yapar.

## API ve güvenlik

- `GET /api/admin/crm?q=&sort=name|company&page=1`: kişi listesi.
- `POST /api/admin/crm`: kişi ekler; UUID `Idempotency-Key` gerekir.
- `GET /api/admin/crm/{id}`: kişi ve ilgili talep bağlantıları.
- `PATCH /api/admin/crm/{id}`: kişi düzenler; güncel `version` gerekir.
- Eski kolon taşıma `PATCH /api/admin/crm` kaldırılmıştır (`405`).

Tüm yollar mevcut admin session doğrulamasını ve rate limit mekanizmasını kullanır. Yazmalarda origin/CSRF kontrolü vardır. Özel tablolar RLS ile korunur, `PUBLIC`, `anon`, `authenticated` doğrudan erişemez. SQL değerleri parametrelidir; HTML React tarafından escape edilir. Kişi listesi kimlik eşleştirme anahtarlarını, oluşturma hashlerini ve kullanıcı/quote gizli alanlarını döndürmez. Liste sorgusu kayıt sayısından bağımsız iki DB sorgusu kullanır. Aramalar 150 karakter, sayfalar 25 kayıtla sınırlıdır; 100–200 kişi için ağır realtime veya indeks bağımlılığı eklenmez.

## Yayın ve rollback

Yeni environment variable yok. Mevcut `DATABASE_URL` / `DATABASE_SSL_CA`, `APP_ORIGIN` ve admin oturumu kullanılır. Email/SMS/quote flag veya provider ayarı değiştirilmez. Rehber endpointleri notification worker çağırmaz.

1. Yerel unit/integration testleri, lint, typecheck ve build tamamlanır. Test providerları kapalı/mock olmalıdır.
2. Yetkili ortamda `node scripts/contacts-migrate.mjs` ile salt okunur sayım alınır.
3. Yedekleme prosedürü doğrulandıktan sonra `node scripts/contacts-migrate.mjs --apply` çalıştırılır. Öncesi/sonrası sayımlar ve mevcut kayıtların hash eşitliği doğrulanır; hassas kayıt içeriği basılmaz.
4. Uygulama deploy edilir. CRM giriş koruması ve yetkili rehber görünümü kontrol edilir. Gerçek mesaj gönderilmez.

Geri dönüşte önce önceki uygulama sürümüne dönülür. Yeni tablolar veri kaybetmemek için tutulur. Tetikleyicide beklenmedik form yazma sorunu saptanırsa DBA transaction içinde yalnızca `link_lead_contact` triggerını kaldırabilir. Mevcut lead/quote tabloları ve kişi kayıtları silinmez. Düzeltmeden sonra aynı migration eksik kişi bağlantılarını tamamlayarak tekrar kurulabilir. Temel migration tamamı geri alınmak için çalıştırılmaz; yeniden numaralandırma yapılmaz.

## Kontroller

`tests/contacts.test.mjs`: 200 üzeri kişi, sayfalama, literal arama, mükerrer/concurrent create, edit/version, validasyon, snapshot ve migration tekrar çalıştırma.

`tests/pipeline-migration.test.mjs`: eski kayıt backfill'i, deterministik ilk kişi bilgisi, quote tokenları/dosya/geçmiş/outbox korunması.

`tests/quotes.integration.mjs`: gerçek HTTP üzerinden session, CSRF, kişi CRUD ve arama; devamında mevcut teklif/dosya/token/görüntülenme/kabul/revizyon testleri. Üretim sağlayıcıları çağrılmaz.

## 23 Eylül 2026 yayın doğrulaması

Production migration uygulandı. Öncesi/sonrası: 5 talep, 3 teklif, 3 teklif thread'i, 3 token, 2 dosya, 24 teklif olayı, 33 talep olayı, 3 dispatch, 22 e-posta işi ve 10 SMS işi. Korunan içerik hashleri eşit. 5 kişi oluşturuldu, 5 talep bağlandı, bağlantısız talep yok. Provider gönderimi yapılmadı.

94 unit testi, mevcut form HTTP entegrasyonu (77 public route dahil), teklif/rehber HTTP entegrasyonu, lint, TypeScript ve production build geçti. 31 client artifactında iletişim secret/provider kodu bulunmadı. 1440px masaüstü ve 390px mobil tarayıcıda kişi arama, yeni kişi oluşturma, adres düzenleme ve taşma kontrolü yerel verilerle doğrulandı.
