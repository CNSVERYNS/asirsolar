# Asır Solar — resmi yayın öncesi zorunlu kontrol listesi

Kullanıcı kararı: 10 Eylül 2026. Mevcut Vercel adresi üzerinde geliştirme ve kontrol devam eder. Gerçek domainle resmi açılış ve müşteri duyurusu, aşağıdaki zorunlu işler tamamlanmadan yapılmaz. Vercel adresinin şu anda internetten erişilebilir olması, bu listenin tamamlandığı anlamına gelmez.

**Şimdiki kapsam:** Onur Durak için WhatsApp’ı etkinleştir. Search Console, işletme profili, domain geçişi ve e-posta/SMS teslimatının tamamlanması resmi yayın öncesinde yapılacak.

## 1. Kesinleşen iletişim ve bildirim alıcıları

| Mühendis | Yeni form talebi için e-posta | Yeni form talebi için SMS | Sitedeki WhatsApp yönlendirmesi |
| --- | --- | --- | --- |
| Onur Durak | onur.durak@asirsolar.com | +905419243545 | Evet, yalnızca bu kişi |
| Furkan Cansever | furkan.cansever@asirsolar.com | +905431185861 | Hayır |

- [x] WhatsApp alıcısı kullanıcı tarafından Onur Durak olarak doğrulandı.
- [x] Vercel ortamına `NEXT_PUBLIC_WHATSAPP_PHONE=905419243545` ve `NEXT_PUBLIC_WHATSAPP_NAME=Onur Durak` tanımlandı.
- Bağlantı hedefi: `https://wa.me/905419243545`; hazır mesaj taslağını açar. Mesajı ziyaretçi gönderir.
- Masaüstü, mobil alt çubuk ve iletişim sayfası aynı WhatsApp alıcısını kullanır.
- Furkan’ın numarası WhatsApp bağlantısına veya genel site iletişim bileşenlerine eklenmez; SMS bildirim alıcısıdır. SMS yapılandırması sunucu tarafında tutulur, `NEXT_PUBLIC_` kullanılmaz.

## 2. Form → iki e-posta + iki SMS — yayın engeli

**Zorunlu davranış:** Müşteri web sitesindeki iletişim/keşif formunu başarıyla gönderdiğinde talep CRM’e kaydedilir. Onur’a bir e-posta ve bir SMS, Furkan’a bir e-posta ve bir SMS otomatik gönderilir. Bir mühendise atanmış olması diğer mühendisin bildirim almasını engellemez.

### Mevcut durum

- [x] Web formu talebi ortak CRM/Supabase veritabanına kaydeder.
- [x] Her yeni web talebi için iki mühendisin e-posta adresine ayrı kuyruk kaydı oluşturulur.
- [x] Aynı form gönderiminin tekrarlanması ikinci müşteri kaydı ve ikinci e-posta kuyruk çifti oluşturmaz.
- [x] E-posta gönderim altyapısı, hata kaydı ve tekrar deneme mekanizması mevcut.
- [ ] SMTP/e-posta sağlayıcısı bağlandı ve iki adrese gerçek teslimat doğrulandı. **Şu anda yapılandırılmadı; e-postalar gönderiliyor sayılmaz.**
- [ ] SMS sağlayıcısı seçildi, hesap/API erişimi ve gönderici ayarları hazırlandı. **Şu anda SMS entegrasyonu yok.**
- [ ] İki SMS alıcısı sunucu tarafındaki bildirim yapılandırmasına eklendi.
- [ ] Form akışına kalıcı SMS kuyruğu ve gönderim işleyicisi eklendi.

### E-posta kurulumu

- [ ] Şirket posta sağlayıcısı ve kullanılacak gönderici adresi kesinleştirildi; iki mühendis posta kutusuna erişebiliyor.
- [ ] `CRM_SMTP_HOST`, `CRM_SMTP_PORT`, `CRM_SMTP_USER`, `CRM_SMTP_PASSWORD`, `CRM_EMAIL_FROM` Vercel’in gizli sunucu ayarlarına eklendi.
- [ ] Sağlayıcının istediği gönderici/domain doğrulaması ve SPF, DKIM, DMARC ayarları tamamlandı.
- [ ] E-postada talep referansı, müşteri adı, telefon/e-posta, proje bilgisi ve giriş gerektiren CRM bağlantısı doğru görünüyor. Müşteriye yanıt adresi formdaki e-posta.
- [ ] İki ayrı posta kutusunda teslimat ve spam klasörü kontrol edildi; yalnızca SMTP sunucusunun kabul etmesi başarı ölçütü sayılmadı.

### SMS kurulumu

- [ ] Türkiye numaralarına gönderim yapabilen sağlayıcı ve maliyet/hesap koşulları belirlendi.
- [ ] Sağlayıcının gerektirdiği gönderici başlığı veya numarası doğrulandı; API anahtarı ve bakiye hazırlandı.
- [ ] Alıcılar: Onur `+905419243545`, Furkan `+905431185861`. Anahtarlar ve SMS alıcı yapılandırması istemci paketine girmiyor.
- [ ] Her talep ve alıcı için ayrı SMS işi kaydediliyor; form tekrarı yeni bildirim üretmiyor.
- [ ] SMS kısa bir yeni talep bildirimi, talep referansı ve giriş gerektiren CRM bağlantısı içeriyor. Serbest metin müşteri mesajı SMS’e taşınmıyor.
- [ ] Gönderim sağlayıcı mesaj kimliğiyle izleniyor. API kabulü ile telefona teslim ayrılıyor; varsa sağlayıcı teslim raporu güvenilir biçimde işleniyor.
- [ ] Zaman aşımında teslim durumu belirsiz bir SMS körlemesine tekrar gönderilmiyor; sağlayıcının sorgulama/tekrar önleme imkânı kullanılıyor.

### Dayanıklılık ve kabul testi

- [ ] Talep ve dört bildirim işi kayıp yaratmayacak biçimde kalıcı kaydediliyor. Bir kanal veya alıcıdaki hata diğerlerini engellemiyor.
- [ ] İlk bildirim denemesi form kaydından sonra otomatik başlıyor; manuel panel açılması veya günlük görevin beklenmesi gerekmiyor.
- [ ] Geçici hatalar için dakika ölçeğinde otomatik tekrar deneme ve kapasite planı var. Mevcut günlük e-posta tekrar görevi tek başına yeterli kabul edilmiyor.
- [ ] E-posta/SMS ve alıcı bazında durumlar yönetim panelinde görülebiliyor; hata ve yeniden gönderme yönetilebiliyor.
- [ ] Eski bekleyen e-posta kayıtları gönderim açılmadan önce incelendi; geçmiş taleplere istemeden toplu bildirim gitmeyecek.
- [ ] Gerçek bir uçtan uca test yapıldı: tek form → tek CRM kaydı → Onur’un e-posta kutusu + telefonu → Furkan’ın e-posta kutusu + telefonu. Dört teslimat doğrulandı.
- [ ] Aynı gönderimin tekrarında ikinci CRM kaydı veya mükerrer bildirim oluşmadığı test edildi.
- [ ] Bir sağlayıcı/alıcının geçici hatasında kayıt korunuyor, diğer teslimatlar tamamlanıyor, başarısız iş daha sonra doğru şekilde yeniden deneniyor.

**Yayın kabul ölçütü:** Dört bildirimin gerçek teslimatı ve hata senaryoları doğrulanmadan bu bölüm tamamlandı sayılmaz. WhatsApp butonunun çalışması SMS/e-posta gönderim altyapısının yerini tutmaz.

## 3. Google Search Console — resmi yayın öncesi

- [ ] Siteyi yönetecek Google hesabına erişim sağlandı.
- [ ] Gerçek domain belli olduğunda domain mülkü DNS üzerinden doğrulandı. Vercel URL ön eki mülkü gerekiyorsa ayrıca doğrulandı.
- [ ] HTML etiketi yöntemi kullanılıyorsa `GOOGLE_SITE_VERIFICATION` değeri eklendi ve yeniden dağıtıldı.
- [ ] Son kanonik domaine ait `/sitemap.xml` Search Console’a gönderildi; gönderim kabul edildi.
- [ ] Ana sayfa, hizmetler, iletişim ve önemli rehberlerde URL Denetimi/canlı URL testi yapıldı; tarama veya indeksleme engelleri giderildi.
- [ ] Gerekli sayfalar için indeksleme isteği gönderildi. Google’ın indeksleme ve rapor oluşturma süresinin dış süreç olduğu kaydedildi; sıralama garantisi verilmedi.

İşlemler kullanıcı isteğiyle yayın öncesi aşamaya bırakıldı; şu anda Google mülk doğrulaması ve sitemap gönderimi tamamlanmadı.

## 4. Google İşletme Profili ve güvenilir şirket içeriği

- [ ] Mevcut İşletme Profili/Haritalar kaydı bulundu, sahiplik erişimi doğrulandı; mükerrer kayıt açılmadı.
- [ ] Marka, gerçek adres, sabit telefon, hizmetler ve web adresi siteyle tutarlı.
- [ ] Çalışma saatleri şirketçe doğrulandı; site ve uygun yapılandırılmış veri alanlarına eklendi.
- [ ] Gerçek işletme/ekip/saha görsellerinin kullanım izinleri ve açıklamaları hazır.
- [ ] Referans olarak yayımlanacak gerçek projelerin konumu, kapsamı, sistem tipi ve bilinen teknik verileri doğrulandı; stok görseller proje kanıtı olarak kullanılmadı.
- [ ] Mühendislerin yayımlanacak unvan/uzmanlık bilgileri doğrulandı; belge ve sertifika iddiaları dayanağıyla kontrol edildi.

## 5. Gerçek domain ve son yayın kontrolü

- [ ] Domain, DNS ve TLS/HTTPS bağlantısı tamamlandı; tercih edilen www/non-www adresi belirlendi.
- [ ] Vercel domain ayarı, `NEXT_PUBLIC_SITE_URL` ve `APP_ORIGIN` son adresle güncellendi; yeniden dağıtıldı.
- [ ] Eski/alternatif adreslerden kalıcı yönlendirmeler URL yollarını koruyor ve döngü oluşturmuyor.
- [ ] Kanonik adresler, sitemap, robots, sosyal paylaşım ve JSON-LD son domaini kullanıyor.
- [ ] Yönetim/API erişimi korunuyor; yönetim sayfaları noindex; boş veya onaysız içerikler sitemap dışında.
- [ ] KVKK, gizlilik ve çerez metinleri gerçek veri akışları ve e-posta/SMS sağlayıcılarıyla uyumlu olarak son kontrolden geçti.
- [ ] Mobil/masaüstü WhatsApp hedefi yalnızca Onur; form, CRM, iki e-posta ve iki SMS son domain üzerinde tekrar doğrulandı.
- [ ] `npm run lint`, `npm test`, üretim derlemesi ve ilgili entegrasyon kontrolleri geçti.
- [ ] `node scripts/check-seo.mjs <son-site-adresi> <son-kanonik-adres>` geçti; son yayın kontrolü tarih ve sonuçları kaydedildi.

Teknik SEO ayrıntıları ve resmî kaynaklar: [SEO_SETUP.md](SEO_SETUP.md). Sağlayıcı şifreleri, API anahtarları ve yönetici parolaları bu dosyaya yazılmaz.
