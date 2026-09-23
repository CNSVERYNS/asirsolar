# Kısa site adresleri

23 Eylül 2026: Herkese açık adresler kısa, ASCII ve içerikle ilişkili olacak şekilde düzenlendi.

| Önce | Şimdi |
| --- | --- |
| `/ges-hesaplama` | `/hesapla` |
| `/ges-kurulumu/kocaeli/gebze-osb` | `/bolgeler/kocaeli/gebze-osb` |
| `/hizmetler/endustriyel-cati-ges` | `/hizmetler/cati-ges` |
| `/rehber/gunes-panelleri-bakim-gerektirir-mi` | `/rehber/panel-bakimi` |
| `/gizlilik-politikasi` | `/gizlilik` |
| `/cerez-politikasi` | `/cerezler` |
| `/projeler/<UUID>` | `/projeler/<proje-adi>` |

50 rehber ve 7 hizmet adresi kısaldı. Tüm eşleştirmeler `lib/redirects.ts` içinde; eski adresler tek adımda kalıcı HTTP 308 ile yeni adrese gider. Bölge alt yolları ve sorgu parametreleri korunur. Menü, içerik bağlantıları, breadcrumb, canonical, Open Graph ve sitemap yeni adresleri kullanır. Eski sosyal paylaşım görseli adresleri de çalışır.

Keşif bağlantıları `/iletisim?proje=konut`, `?bolge=gebze-osb` veya `?konu=fizibilite` gibi kısa seçenekler kullanır. Hesaplayıcı, mesaj paragrafını URL'ye koymak yerine bölge ve sayısal özeti taşır; form aynı açıklamayı oluşturur. Eski `proje` etiketleri ve `mesaj` bağlantıları geçerlidir. Form gönderme davranışı değişmez.

## Proje adresleri ve yayın sırası

1. `202609230002_project_slugs.sql` mevcut proje tablosuna benzersiz `slug` ekler. Türkçe karakterler ASCII'ye dönüşür; temel ad en fazla 32 karakterdir. Aynı adlar `-2`, `-3` ile ayrılır. Adres ilk kayıtta belirlenir, isim düzenlemesiyle değişmez.
2. `node scripts/project-slugs-migrate.mjs` yetkili `DATABASE_URL` / `DATABASE_SSL_CA` ile salt okunur sayım yapar. `--apply`, yalnızca bu eklemeli migration'ı çalıştırır ve proje içerikleri ile görsel hashlerinin değişmediğini kontrol eder.
3. Migration uygulandıktan sonra uygulama yayınlanır. Trigger eski uygulama sürümünden gelen INSERT işlemlerini de destekler. Tekrar çalıştırılabilir; ID, içerik, tarih, görsel veya yayın durumu değişmez.
4. Eski UUID sayfaları yalnızca proje yayındaysa 308 döner. Taslak ve silinen projeler her iki adreste de 404 döner. Sitemap, görsel önizlemeleri ve projeler ekranı kalıcı adı kullanır.

Geri dönüş gerektiğinde önceki uygulama sürümü yeniden yayınlanabilir; ek kolon ve trigger korunur. Veritabanından proje veya adres silinmez. Özel teklif erişim tokenları, yönetim/API yolları ve bildirim sağlayıcıları değişmez.

## Doğrulama

- `npm test`: URL eşleştirmeleri, kısa form bağlamı, kalıcı proje adresleri, çakışmalar ve mevcut veriye migration.
- `npm run test:integration`: gerçek HTTP yönlendirmeleri, proje yayınlama/gizleme, canonical, form ve CRM akışları.
- `npm run test:quotes`: mevcut teklif ve kişi rehberi akışları.
- `node scripts/check-links.mjs <origin>`: salt okunur yönlendirme, iç bağlantı, canonical, proje ve kısa form kontrolleri.
- `node scripts/check-seo.mjs <origin> https://www.asirsolar.com`: sitemap, indeksleme ve yapılandırılmış veriler.
- `npm run lint` ve `npm run build`.

23 Eylül doğrulaması: 97 otomatik test, CRM/form ve teklif/rehber HTTP entegrasyonları, lint ve üretim derlemesi geçti. Yerelde 63 yönlendirme, 72 herkese açık sayfa ve 75 iç bağlantı kontrol edildi. Canlı migration iki projeye benzersiz adres atadı; iki proje ve iki görselin korunan içerik hashleri aynı kaldı. Tarayıcı bağlantısı bu oturumda bulunmadığından görsel kontrol yapılmadı.
