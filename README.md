# Asır Solar — Kurumsal Web Sitesi

Next.js 16 App Router, TypeScript ve React ile hazırlanmıştır. Şirketin mevcut hizmet, ekip ve rehber içerikleri korunmuştur.

## Yerelde çalıştırma

```bash
npm install
npm run dev       # http://localhost:3000
npm run lint
npm test
npm run build
npm run start
```

Node.js 24 kullanılır. İlk panel hesapları için geliştirme sunucusu kapalıyken `npm run crm:setup` çalıştırın.

## Marka ve tasarım

- `app/brand.css`: marka renkleri, yeni ana sayfa, responsive düzen ve ortak sayfa görünümü.
- `app/globals.css`: ortak tasarım değişkenleri ve mevcut alt sayfa bileşenleri.
- `public/images/brand/asir-logo.jpeg`: kullanıcı tarafından sağlanan orijinal logo. Üst menü, alt bölüm ve site simgesinde kullanılır.
- `components/SolutionFinder.tsx`: konut, işletme ve arazi seçenekleri. Seçim, keşif formunun proje türüne aktarılır.
- `components/MobileMenu.tsx`: yerel HTML dialog; klavye odağı, Escape ile kapatma ve arka plan kaydırma kilidi.
- Mobil ekranlarda sabit arama / ücretsiz keşif bağlantıları bulunur.

## Arka plan videosu

Kaynak: [Aerial Shot of Solar Panels — Braeson Holland / Pexels](https://www.pexels.com/video/aerial-shot-of-solar-panels-8851164/).
Lisans: [Pexels License](https://www.pexels.com/license/).

Bu video temsili stok görüntüdür; Asır Solar'ın tamamladığı bir proje olarak sunulmaz.

- `public/videos/solar-desktop.mp4`: 1600 × 900, 24 fps, 14 saniye; yaklaşık 5,2 MB.
- `public/videos/solar-mobile.mp4`: 768 × 432, 24 fps, 14 saniye; yaklaşık 0,83 MB.
- İki video da sessiz H.264 / yuv420p formatında, progressive playback için faststart ile hazırlanmıştır.
- `public/images/solar-poster.webp`: videonun ilk karesi; ilk açılışta ve video yüklenemezse gösterilir.
- Video, ilk render sonrasında ekran boyutuna uygun dosyayla otomatik ve sessiz olarak başlar; döngü halinde oynar. Görünür oynatma/duraklatma düğmesi yoktur. Hareket azaltma tercihi açık olduğunda fotoğraf gösterilir.
- Sayfa arka plana geçtiğinde veya video görünür alandan çıktığında oynatma durur.
- Tarayıcı otomatik oynatmayı engellerse fotoğraf görünür; sayfadaki ilk dokunma/tıklama ile oynatma yeniden denenir.
- Video dosyaları siteden sunulur; üçüncü taraf oynatıcı veya video izleme çerezi yoktur.

## Şirket ve içerik verileri

`data/company.ts`, `data/team.ts` ve `data/services.ts` şirketin mevcut doğrulanmış bilgilerini içerir. Şirket bilgileri başlangıç projesindeki `1.jpeg`, `2.jpeg`, `3.png` kaynaklarından alınmıştır. Bu kaynak belgeler public klasöründe değildir.

Mevcut stok fotoğraflar `public/images/stock/` klasöründedir. Proje kayıtları `data/projects.ts` üzerinden yönetilir. Doğrulanmış saha fotoğrafı, konum ve kapasite sağlanmadığı için proje, referans, sertifika veya kurulu güç sayısı üretilmemiştir.

## Keşif talebi

Web formu talepleri doğrudan veritabanına kaydeder ve takip numarası gösterir. `/admin` üzerinden Onur Durak ve Furkan Cansever ortak müşteri listesine, aşama panosuna, görüşme notlarına ve teklif takibine erişir. Telefon / WhatsApp müşterileri elle eklenebilir.

Üretimde Supabase PostgreSQL, yerelde PGlite kullanılır. E-posta bildirimleri kalıcı kuyrukta tutulur; SMTP bağlantısı ayrıca yapılandırılır.

Kurulum, güvenlik, Vercel ortam değişkenleri, domain geçişi ve testler: [CRM_SETUP.md](CRM_SETUP.md).

`lib/enquiry.ts` talep doğrulamasını, izin verilen proje türlerini ve e-posta URL kodlamasını yönetir. `tests/enquiry.test.mjs` eksik/geçersiz alanları, URL parametrelerini ve özel karakterli metinlerin korunmasını doğrular.

## Yerel depolama ve yasal içerik

Reklam veya analiz izleyicisi eklenmemiştir. Bildirimin 'Anladım' tercihi yerel depolamada hatırlanır; 'Tercihi saklama' seçeneği kayıt oluşturmaz. Yerel depolamanın kapalı olması siteyi bozmaz. Mevcut KVKK, gizlilik ve çerez sayfaları taslak olarak işaretlidir.

## Yedek

Değişiklik öncesi kaynakların yedeği `.local-backups/before-brand-refresh.zip` içindedir. `.local-tools` medya araçlarını, test verilerini ve özel ilk giriş dosyalarını içerir; uygulamanın çalışma bağımlılığı değildir. Her iki klasör sürüm kontrolünden hariçtir.
