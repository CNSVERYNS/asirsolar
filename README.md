# ASIR SOLAR — Kurumsal Web Sitesi

Vite + vanilla JS ile yapılandırılmış statik site projesi.

## Proje Yapısı

```
asirSolar/
├── index.html              # Ana sayfa (tüm bölümler)
├── public/
│   └── favicon.svg         # Site ikonu
├── src/
│   ├── main.js              # Giriş noktası — tüm modülleri başlatır
│   ├── style.css            # Tailwind + özel stiller
│   ├── data/
│   │   └── regions.js       # 81 il → bölge güneş katsayısı verisi
│   └── modules/
│       ├── mobileMenu.js    # Mobil menü aç/kapat
│       ├── roiCalculator.js # ROI hesaplayıcı (mahsuplaşma mantığı)
│       ├── gallery.js       # Galeri filtre + kaydırma
│       └── contactForm.js   # İletişim formu (demo)
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Kurulum

```bash
npm install
```

## Geliştirme

Yerel geliştirme sunucusunu başlatır (canlı yenileme ile):

```bash
npm run dev
```

Terminalde çıkan adresi (genelde `http://localhost:5173`) tarayıcıda açın.

## Derleme (Production Build)

```bash
npm run build
```

Optimize edilmiş, yayına hazır dosyaları `dist/` klasörüne üretir.

Derlenmiş halini yerelde kontrol etmek için:

```bash
npm run preview
```

## Yayına Alma (Deploy)

`npm run build` sonrası oluşan `dist/` klasörünü şu yollardan biriyle yayınlayabilirsiniz:

- **Vercel (sürükle-bırak):** [vercel.com/new](https://vercel.com/new) adresinden "Deploy" ekranına `dist/` klasörünü sürükleyin.
- **Netlify Drop:** [app.netlify.com/drop](https://app.netlify.com/drop) adresine `dist/` klasörünü sürükleyin.
- **GitHub + Vercel (otomatik deploy):** Bu projeyi bir GitHub reposuna push edin, ardından Vercel'de "Import Git Repository" ile bağlayın. Vercel `npm run build` komutunu ve `dist/` çıktı klasörünü otomatik algılar. Bundan sonra her push'ta site otomatik güncellenir.

## Yayına Almadan Önce Yapılması Gerekenler

`index.html` dosyasının en üstündeki HTML yorum bloğunda detaylı bir kontrol listesi var. Özet:

1. **İletişim bilgileri** — telefon, e-posta, adres yer tutucularını gerçek bilgilerle değiştirin (`index.html` içinde `0850 000 00 00` ve `info@asirsolar.com.tr` aratın).
2. **ROI hesaplayıcı sabitleri** — `src/modules/roiCalculator.js` dosyasındaki `PRICE_PER_KWH`, `SELL_BACK_RATIO`, `COST_PER_KW` değerlerini güncel EPDK/dağıtım şirketi tarifeleri ve gerçek ekipman fiyatlarınızla güncelleyin.
3. **Galeri fotoğrafları** — `index.html` içindeki `#galeri` bölümünde şu an Unsplash'ten gerçek ama şirkete ait olmayan yer tutucu fotoğraflar var; gerçek proje fotoğraflarınızla değiştirin.
4. **İstatistik ve müşteri yorumları** — "Referanslar" ve "Neden Solar" bölümlerindeki örnek rakam/yorumları gerçek verilerle değiştirin.
5. **İletişim formu** — şu an sadece arayüzde "başarılı" mesajı gösteriyor (`src/modules/contactForm.js`); gerçek gönderim için bir form servisi (Formspree, Netlify Forms, kendi backend'iniz vb.) bağlayın.
