# CRM satış süreci ve kısa referanslar

> 23 Eylül 2026: Kanban kullanıcı talebiyle kaldırıldı. `/admin/crm` artık [kişi rehberi](CRM_CONTACTS_SETUP.md); eski kolon taşıma API'si kullanılamaz. Aşağıdaki pano anlatımı geçmiş uygulamaya aittir. ASR referansları, sequence'lar, mevcut talep/teklif durumları ve migration geçmişi korunmuştur.

## Mevcut mimari ve kapsam

`/admin/crm` mevcut admin oturumu altında Satış Süreci panosudur. `/api/admin/crm` GET yalnızca okur; PATCH mevcut Origin, oturum, JSON boyut ve DB rate-limit kontrollerini kullanır. Bu ekran bildirim worker'ını çağırmaz. Mevcut talep listesi, detay sayfası ve teklif URL'leri korunur.

Public quote erişimi hâlâ rastgele token + SHA-256 eşlemesidir. Talep/teklif numarası bir yetkilendirme aracı değildir. UUID'ler, tokenlar, dosyalar, notification queue ve sağlayıcı ayarları değiştirilmez. Bu görevde gerçek mesaj gönderilmez; production `CRM_EMAIL_ENABLED`, `CRM_QUOTES_SEND_ENABLED` ve `CRM_SMS_ENABLED` değerlerine dokunulmaz. Yeni env/dependency yoktur.

## Referans numaraları

| Alan | Görünen biçim | Sayaç |
| --- | --- | --- |
| `leads.reference_number` | `ASR-TLP-1` | `asir_crm.lead_reference_seq` |
| `quotes.quote_number` | `ASR-TKLF-1` | `asir_crm.quote_reference_seq` |

Her sayaç bağımsızdır. PostgreSQL DEFAULT içinde `nextval` kullanılır; çalışma zamanında MAX+1 yoktur. Numara taslak/kayıt oluşturulurken ayrılır, immutable ve UNIQUE'dir. İşlem geri alındığında sequence değeri tekrar kullanılmaz; boşluk olabilir. Bu sistem artan ve benzersizdir, kesintisiz/muhasebe fişi sayacı değildir. Public form idempotency kontrolü sayacı almadan önce çalışır.

Her teklif sürümü kendi numarasını alır: `ASR-TKLF-12 / V1`, ardından aynı `thread_id` altında `ASR-TKLF-13 / V2`. Eski teklif ve sürüm ilişkisi korunur. Taslak numaraları iptal edilince yeniden kullanılmaz.

Eski `leads.reference` ve `quote_threads.quote_number` alanları tarihçe/önceki deployment uyumluluğu için korunur. `quotes.legacy_quote_number` migration sırasında eski numaranın kopyasını tutar. Yeni uygulama bunları normal görünümde göstermez. Önceki kodla aynı anda oluşturulan kayıtlar da yeni DB DEFAULT'ları sayesinde kısa numara alır. Eski thread sayacı yalnızca uyumluluk alanını doldurur; müşteri teklif numarası değildir.

Admin listesi/detayı, Kanban, form başarı yanıtı, teşekkür/internal email, SMS, teklif emaili, public sayfa ve onay/revizyon ekranları kısa numarayı kullanır. Public sayfada yalnızca `leadReference` eklenir; raw lead ID, e-posta veya telefon eklenmez. Önceden gönderilmiş e-postalar ve yüklenmiş PDF içeriği geriye dönük değiştirilemez; yeni sayfa ve dosya çevresindeki etiketler yeni numarayı gösterir.

Geçmiş event içerikleri DB'de korunur. Talep timeline'ı `quote_events.id = lead_events.id` bağlantısından ilgili sürümün yeni numarasını çözer; serbest müşteri/not metinlerinde rastgele string replace yapılmaz. Sağlayıcı teslimat UUID'si normal timeline metninden çıkarılır; özel audit kaydı korunur.

## Pipeline aşamaları

Mevcut lead `stage` enum'u değiştirilmez. `pipeline_phase` (`new/reviewing/preparing`) yalnızca manuel aşama ayrıntısını tutar. Teklif durumu ayrı bir kopya kolonda senkronize edilmez; her okuma güncel quote kayıtlarından türetilir.

| Kolon | Kaynak / davranış |
| --- | --- |
| Yeni Talep | Teklifi olmayan `new` lead |
| İnceleniyor | Manuel `meeting`; son teklif iptal/expired/rejected ise takip aşaması |
| Teklif Hazırlanıyor | Son teklif draft veya manuel hazırlık aşaması |
| Teklif Gönderildi | Son geçerli teklif sent; eski teklif modülü öncesi `proposal` kayıtları da burada |
| Teklif Görüntülendi | Son geçerli teklif viewed |
| Revizyon İstendi | Son geçerli teklif revision_requested |
| Teklif Kabul Edildi | Kabul edilmiş teklif veya eski CRM `won/in_progress/completed` aşaması |
| Kaybedildi | Mevcut `lost` aşaması; kayıt silinmez |

Kabul önceliklidir. Sonraki quote taslağı hazırlık olarak görünür; önceki sürüm yeni sürüm gönderilene kadar okunabilir. Geçerlilik tarihi İstanbul günü ile değerlendirilir. Birden çok ticari thread varsa kart en yeni teklifi gösterir; kabul edilmiş thread ve açık thread'ler sunucuda ayrıca değerlendirilir.

Manuel hedefler Yeni Talep, İnceleniyor, Teklif Hazırlanıyor ve Kaybedildi'dir. Sent/viewed/revision/accepted hedefleri PATCH üzerinden reddedilir. Aktif gönderilmiş teklif varken geriye manuel taşınamaz; draft varken önce draft tamamlanmalı veya iptal edilmelidir. Kabul edilmiş talep Kanban'dan kayıp yapılamaz. Eski lead detay ekranındaki mevcut iş/uygulama aşamaları geriye uyum için korunur.

Kaybedildi penceresi Fiyat/Rakip firma/Proje ertelendi/Müşteri vazgeçti/Ulaşılamadı/Diğer seçeneklerini sunar. Diğer notu isteğe bağlıdır. Mevcut `rejection_reason` ve `lead_events` kullanılır. Kayıp işlemi mevcut teklif bağlantısını iptal etmez ve mesaj göndermez. Müşterinin geçerli teklifi daha sonra kabul etmesi kabul aşamasına taşır. Teklifi kapatmak için mevcut Teklifi İptal Et işlemi kullanılır.

Mutation, lead satır kilidi + `version` + beklenen kolon + son aktivite kontrolü altında yapılır. Müşteri eylemiyle yarışan sürükleme güncel veriyi ezmez; 409 ve yenileme mesajı döner.

## UI, arama ve filtreler

Karttan talep detayına gidilir. Menü: Talebi Aç, Teklif Hazırla, Son Teklifi Görüntüle, telefon/e-posta kopyalama. Drag/drop yanında klavye ve dokunma için Aşamayı değiştir select'i bulunur. Sekiz kolon yatay kayar; mobilde scroll-snap kullanılır. Loading/error/empty durumları vardır.

Tam `ASR-TLP-N` / `ASR-TKLF-N` araması eşitlik sorgusudur; 1 araması 10'u getirmez. Önceki teklif sürümünün numarası da müşteriyi bulur. Kısmi arama ad/e-posta/telefon/proje ve eski referansları kapsar; `%`/`_` escape edilir, SQL parametreleri bağlanır. Aynı referans araması mevcut talep listesine de eklenmiştir.

Filtreler: proje, oluşturulma tarih aralığı (İstanbul), pipeline aşaması, teklif var/yok, görüntülendi/görüntülenmedi, kabul var/yok. Görüntülenme/kabul bilgisi ticari thread'lerin en son sürümleri üzerinden değerlendirilir. Mevcut şemada ayrı şehir alanı olmadığından metinden şehir tahmini yapılmaz.

Sıralama: son aktivite, yeni/eski, tutar. Tutar sıralaması para birimlerini ayrı gruplar; kur dönüşümü yapılmaz. Summary ve kolon adetleri filtrelenmiş tüm sonuçları kapsar. Kartlar sayfa başına 200 ile sınırlıdır; daha fazlası sayfalanır ve gösterilen kart adedi belirtilir.

Toplam açık tutar, her thread'in son sürümünde geçerli draft/sent/viewed/revision tekliflerini içerir; kabul/kayıp lead'ler dışarıdadır. TRY/USD/EUR ayrı toplanır. Gönderilen sayacı en son teklifi gönderilmiş veya eski `proposal` aşamasındaki talepleri sayar; provider teslimat sayısı değildir.

## Performans ve yenileme

Kanban okuması tek SQL isteğinde kartlar + summary + kolon adetlerini döndürür; kart başına uygulama sorgusu yoktur. Indexed lateral lookups ile son teklif ve son event bulunur. `quotes_pipeline_latest(lead_id,created_at DESC,id DESC)` ve `events_lead_activity(lead_id,created_at DESC,sequence DESC)` eklenir. Mevcut lead stage/created, thread-version ve lead FK indeksleri reuse edilir. İki referans için UNIQUE B-tree vardır; küçük mevcut veri kümesi için ekstra trigram/GIN extension kurulmaz. Çok büyük veri kümelerinde EXPLAIN/ölçümle ayrıca değerlendirilmelidir.

Yeni realtime dependency yoktur. Görünür sekmede 30 saniye polling, sekme odağında ve manuel butonda yenileme yapılır. Gizli sekmede polling isteği gönderilmez. İstek iptali/sıra kontrolü eski arama cevabının yenisini ezmesini engeller. GET hiçbir email/SMS işlemi tetiklemez.

## Migration ve doğrulama

`supabase/migrations/202609180001_pipeline_references.sql` additive migration'dır. Kilit süresi 5 saniyedir. Transaction içinde lead/thread/quote yazmaları kısa süre kilitlenir. Eski kayıtlar `created_at ASC,id ASC` sırasıyla numaralanır. Önceden atanmış geçerli kısa numaralar korunur; yeni değerler mevcut en yüksek numara ve sequence high-water mark sonrasından başlar. Bu durumda eski kayıt numaralarının tamamen tarih sırasına dizilmesi için mevcut numaralar değiştirilmez.

UNIQUE indeks, deterministic backfill, ardından NOT NULL/format/default/immutability uygulanır. Tekrar uygulama sayacı geri sarmaz. Başka bir deployment kayıt oluştururken yeni numaralar çakışmaz. Sequence tüketimi transaction rollback'inde geri alınmayabilir; hata sonrası tekrar çalışma güvenli ama boşluk bırakabilir.

```powershell
node scripts/pipeline-migrate.mjs          # yalnızca audit/counts/varsa sequence bilgisi
node scripts/pipeline-migrate.mjs --apply  # yalnızca bu migration
```

Mevcut `DATABASE_URL` ve `DATABASE_SSL_CA` kullanılır. Komut provider import/çağrısı yapmaz; secret veya müşteri verisi yazdırmaz. Öncesi/sonrası satır adetleri ile kimlikler, token eşlemeleri, ticari teklif alanları, dosya hash'leri, history ve bildirim kimlikleri karşılaştırılır. Canlı kullanıcı aynı anda kayıt düzenlerse koruma karşılaştırması bunu da tespit eder; otomatik veri geri alma yapılmaz, audit tekrar incelenir.

Canlı eski URL'nin raw token'ı erişim tablosunda bulunmaz. Migration testi token hash/quote eşlemesinin aynı kaldığını doğrular; gerçek URL verilmeden hash'ten URL üretilmez. Bir eski linki elle kontrol ederken yalnızca sayfayı okumak yeterlidir; müşteri onay/revizyon butonlarına basmayın.

## Testler / release kontrolü

```powershell
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run test:integration
npm run test:quotes
node scripts/check-communication-build.mjs
node scripts/check-pipeline.mjs https://www.asirsolar.com
```

Provider testleri mock; HTTP testleri ayrı localhost DB ve boş credentials/kapalı kanallarla çalışır. Kısıtlı Windows belleğinde aynı unit suite şu komutla çalışabilir:

```powershell
node --wasm-num-compilation-tasks=1 --test --liftoff-only --no-wasm-tier-up --test-concurrency=1 tests/*.test.mjs
```

Build için process-only `CIRCLE_NODE_TOTAL=2` kullanılabilir. Bunlar production env ayarları değildir. Gerçek veri ekleyerek sequence testi yapılmaz; production'daki bir sonraki numara `last_value/is_called` üzerinden **nextval tüketmeden** raporlanır. Eşzamanlı oluşturma ve idempotency izole DB'de test edilir.

## Production migration sonucu — 22 Eylül 2026

Migration uygulandı; korunan alanların önce/sonra hash karşılaştırması başarılı:

| Kayıt | Önce | Sonra |
| --- | ---: | ---: |
| Talep | 5 | 5 |
| Teklif / thread / token | 3 / 3 / 3 | 3 / 3 / 3 |
| Dosya | 2 | 2 |
| Talep / teklif event | 33 / 24 | 33 / 24 |
| Email / SMS outbox | 22 / 10 | 22 / 10 |
| Quote dispatch | 3 | 3 |

Talep aralığı `ASR-TLP-1`–`ASR-TLP-5`; teklif aralığı `ASR-TKLF-1`–`ASR-TKLF-3`. Sequence `last_value` değerleri 5 ve 3, ikisinde `is_called=true`. Audit anında sıradaki numaralar **ASR-TLP-6** ve **ASR-TKLF-4**; doğrulama için `nextval` tüketilmedi veya production test kaydı açılmadı. Sonraki gerçek kullanım bu değerleri doğal olarak artırır.

Canlı PostgreSQL üzerinde read-only pipeline sorgusu 5 kart döndürdü; her iki referansla tam eşleşme araması geçti. Bu kontrol hiçbir provider/worker çağırmadı. Token eşlemeleri ve dosya içeriği hash'leri değişmedi. Migration öncesi oluşturulmuş gerçek tokenla erişim, izole test DB'sinde migration sonrasında da doğrulandı; mevcut production linklerinin raw tokenları kullanılmadı.

Release doğrulamaları: 75/75 unit test, lint, `tsc --noEmit`, production build, CRM ve quote HTTP integration suite başarılı. 27 client artifact kontrolünde iletişim secret/provider kodu bulunmadı. Yerel tarayıcıda masaüstü sürükle-bırak, kayıp nedeni penceresi ve 390 px mobil yerleşim kontrol edildi. Gerçek email/SMS gönderilmedi.

## Rollback

Önceki `fc78488` uygulama deployment'ına dönülebilir. Bu görev yeni notification purpose veya provider davranışı getirmediğinden gönderim flag'lerini değiştirmek ya da kuyrukları silmek gerekmez. Yeni tablolar/kolonlar/sequence/trigger'lar yerinde kalır; DROP/reset/renumber çalıştırılmaz.

Eski uygulama legacy numaraları gösterebilir; yeni kayıtlar default/trigger sayesinde kısa numarasını da almaya devam eder. UUID/token URL'leri ve dosyalar aynı kalır. İleri deploy edildiğinde kısa numaralar tekrar görünür. Eski uygulamadaki migration script'lerini çalıştırmayın; yalnızca uygulama deployment'ını geri alın. Tekrar ileri geçişte sayaçlar ve UNIQUE kontrolleri audit edilir. Veri geri yükleme ancak ayrı, planlı backup/restore süreciyle yapılmalıdır.
