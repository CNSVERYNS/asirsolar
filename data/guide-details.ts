import type { ContentSection } from "./service-details";

type GuideDetail = {
  updatedAt: string;
  sections: ContentSection[];
  sources: { label: string; href: string }[];
  calculator?: boolean;
};
const pvgis = { label: "Avrupa Komisyonu JRC — PVGIS üretim tahmini ve kullanıcı kılavuzu", href: "https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/pvgis-5-user-manual_en" };
const epdk = { label: "EPDK — Lisanssız elektrik üretimi mevzuatı", href: "https://epdk.gov.tr/Detay/Icerik/3-0-92-3/elektriklisanssiz-uretim" };
const sedas = { label: "SEDAŞ — Güncel başvuru belgeleri, süreçler ve duyurular", href: "https://www.sedas.com/Tr/icerik_lisanssiz-elektrik-uretimi_580" };

export const guideDetails: Record<string, GuideDetail> = {
  "catim-gunes-paneline-uygun-mu": {
    updatedAt: "2026-09-10",
    sections: [
      { title: "1. Alan, yön ve gölgeyi birlikte değerlendirin", paragraphs: ["Çatı alanının tamamı panel yerleşimi için kullanılamayabilir. Bacalar, ışıklıklar, bakım yolları ve kenar mesafeleri yerleşimde dikkate alınır. Yön ve eğim üretim profilini değiştirir; doğu-batı yerleşimi de tüketim saatlerine göre değerlendirilebilecek seçeneklerdendir.", "Bir üretim modelinde konum, yön, eğim ve kayıp kabulleri açıkça belirtilmelidir. PVGIS gibi araçlar ilk üretim tahminini destekler; yakın çevredeki baca, ağaç ve yapı gölgeleri için yerinde inceleme gerekir."] },
      { title: "2. Yapı ve yalıtım kontrolünü tamamlayın", paragraphs: ["Panel ve taşıyıcı sistem ek yük oluşturur. Mevcut yapının durumu, bağlantı noktaları ve çevresel yükler statik değerlendirmede ele alınır. Çatıdaki sızıntı veya kaplama yenileme ihtiyacı, montajdan önce çözülmesi gereken bir iş olabilir.", "Keşfe hazırlık için mevcut belgeleri ve güvenli bir yerden çekilmiş fotoğrafları paylaşabilirsiniz. Ölçüm ve çatıya erişim saha ekibiyle planlanır."], items: ["Varsa mimari/statik proje ve çatı ölçüleri", "Çatı malzemesi, yaşı ve onarım geçmişi", "Baca, ışıklık ve yakındaki gölge kaynakları", "Elektrik panosunun yeri ve mevcut bağlantı bilgileri"] },
      { title: "3. Uygun çatı ile uygun sistem gücünü ayırın", paragraphs: ["Fiziksel olarak çok sayıda panel yerleştirilebilmesi, tamamının ekonomik veya bağlantı açısından uygun olduğu anlamına gelmez. Son 12 aylık tüketim, gündüz kullanım oranı ve bağlantı koşulları sistem gücü kararına birlikte girer. Gebze’deki bir işletme ile aynı alana sahip bir konutun ihtiyaçları farklı olabilir."] },
    ], sources: [pvgis],
  },
  "gunes-paneli-icin-izin-gerekir-mi": {
    updatedAt: "2026-09-10",
    sections: [
      { title: "Önce bağlantı türünü ve yetkili kurumu belirleyin", paragraphs: ["Bu rehber şebekeye bağlı çatı ve cephe sistemleri için genel bir yol haritasıdır. Lisanssız üretim, başvuru ve teknik yükümlülüklerin olmadığı anlamına gelmez. Şebekeden bağımsız sistemlerde ise elektrik şebekesine bağlantı süreci farklıdır; yapıya ve sahaya ilişkin gereklilikler ayrıca değerlendirilir.", "Gebze ve Kocaeli’de başvuru hazırlarken abonelikteki şebeke işletmecisini kontrol edin. SEDAŞ bölgesi için güncel belge listeleri ve duyurular aşağıdaki resmî sayfada bulunur. OSB içindeki bir tesis için ilgili OSB’nin dağıtım birimiyle başvuru yolu netleştirilmelidir."] },
      { title: "Başvurudan işletmeye genel yol haritası", paragraphs: ["İşlem sırası ve gerekli belgeler tesisin türüne ve başvuru kapsamına göre değişebilir. Ayrıntılı listeyi işlem tarihindeki resmî kaynaklardan kontrol edin."], items: ["Tüketim tesisi, kullanım hakkı ve teknik bilgilerin hazırlanması", "Bağlantı başvurusu ve ilgili kurumun değerlendirmesi", "Uygun bulunan başvuru için proje onayı ve anlaşma işlemleri", "Onaylı kapsamla uyumlu kurulum, kabul ve sayaç işlemleri", "Gerekli sistem kullanım ve işletmeye geçiş işlemlerinin tamamlanması"] },
      { title: "Teklif almadan önce hangi belgeler hazırlanabilir?", paragraphs: ["Elektrik aboneliği ve tüketim bilgileri, tesis adresi, mülkiyet veya kullanım durumunu gösteren belgeler ve varsa elektrik/yapı projeleri ilk değerlendirmeyi kolaylaştırır. Bunlar genel hazırlık bilgileridir; başvuruda istenecek kesin listeyi yetkili kurum belirler.", "Bir başvuru takvimi hazırlanırken kurum değerlendirmesi, eksik belge tamamlama, proje onayı ve saha işleri ayrı düşünülmelidir. Bağlantı kapasitesi, ücretler veya kesin tamamlanma süresi, yalnızca genel bir internet rehberine dayanılarak kabul edilmemelidir."] },
    ], sources: [epdk, sedas, { label: "SEDAŞ — Lisanssız üretim başvuru portalı", href: "https://online.sedas.com/Luy/Login" }],
  },
  "yatirimin-geri-donusu-nasil-hesaplanir": {
    updatedAt: "2026-09-10", calculator: true,
    sections: [
      { title: "Basit geri ödeme hesabının girdileri", paragraphs: ["İlk yatırım tutarına ekipman, montaj ve projeye dâhil diğer giderler aynı kapsamla eklenir. Yıllık üretim tahmini sahaya göre hazırlanır. Üretimin binada kullanıldığı bölüm ile şebekeye verildiği bölüm ayrı değerlendirilir.", "Öz tüketimdeki birim tasarruf değeri, güneş enerjisi sayesinde gerçekten azalan elektrik maliyetini temsil eder. Faturanın tamamını tüketim miktarına bölmek, sabit kalemler nedeniyle bu değeri her durumda doğru vermez. Şebekeye verilen enerjinin değeri ise geçerli mevzuat ve sözleşme koşulları doğrulanarak girilmelidir."] },
      { title: "Hesap nasıl çalışır?", paragraphs: ["Yıllık brüt fayda = öz tüketilen enerji × kaçınılan birim maliyet + şebekeye verilen enerji × varsayılan birim değer. Yıllık net fayda, bu toplamdan yıllık işletme ve bakım giderlerinin çıkarılmasıyla bulunur.", "Basit geri ödeme süresi = ilk yatırım / yıllık net fayda. Net fayda sıfır veya negatifse bu varsayımlarla bir geri ödeme süresi oluşmaz. Aşağıdaki araç, girdiğiniz sabit yıllık değerler üzerinden bu hesabı yapar."] },
      { title: "Sonucu yatırım kararı için nasıl kullanmalısınız?", paragraphs: ["Bu hesap ilk yılın net faydasının sonraki yıllarda sabit kaldığını varsayar. Finansman, vergi, enflasyon, tarife değişimi, üretim kaybı ve ekipman yenilemesi hesaba katılmaz. Dolayısıyla sonuç bir teklif veya getiri garantisi değildir.", "Karşılaştırma için aynı kapsamda birkaç senaryo deneyin: daha düşük üretim, daha düşük öz tüketim ve daha yüksek bakım gideri. Ayrıntılı fizibilitede yıllara yayılan nakit akışı, tüketim saatleri ve geçerli mahsuplaşma koşulları ayrıca incelenir."] },
    ], sources: [pvgis, epdk],
  },
};
