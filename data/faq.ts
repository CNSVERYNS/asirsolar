// Sıkça sorulan sorular — Google'da ve AI arama motorlarında en çok
// karşılaşılan, gerçek arama niyetine dayalı sorular. Cevaplar; doğrulanamayan
// hiçbir rakam veya vaat içermez (fiyat, geri ödeme süresi, tasarruf tutarı
// gibi değişken kalemler somut sayı yerine "keşif sonrası netleşir" ile
// yanıtlanır — bkz. data/company.ts üstündeki dürüstlük kuralı).

export type FaqItem = {
  question: string;
  answer: string;
  // Eşleşen bir Rehber makalesi varsa slug'ı — kısa cevaptan uzun,
  // ayrıntılı makaleye link vermek için (bkz. data/guides.ts).
  guideSlug?: string;
};

export const faqItems: FaqItem[] = [
  {
    question: "Güneş paneli kurulumu ne kadar sürer?",
    answer:
      "Süreç keşif, tüketim analizi, projelendirme, saha uygulaması ve devreye alma aşamalarından oluşur. Toplam süre; sistem büyüklüğü, izin/başvuru süreçleri ve saha koşullarına göre değişir — netleşen takvim, keşif sonrası hazırlanan proje ile birlikte paylaşılır.",
    guideSlug: "gunes-paneli-kurulumu-ne-kadar-surer",
  },
  {
    question: "Güneş paneli kurmak için izin gerekir mi?",
    answer:
      "Evet. Çatı ve cephe tipi güneş enerjisi sistemleri, ilgili elektrik dağıtım şirketi (EDAŞ) ile yapılan bağlantı başvurusu ve lisanssız elektrik üretimi mevzuatına tabidir. Bu başvuru ve koordinasyon süreci, projelendirme aşamasının bir parçası olarak tarafımızca yürütülür.",
    guideSlug: "gunes-paneli-icin-izin-gerekir-mi",
  },
  {
    question: "Evim veya işletmem için kaç kW'lık sistem gerekir?",
    answer:
      "İhtiyaç duyulan sistem büyüklüğü; yıllık elektrik tüketiminiz, çatı/cephe alanınız ve panellerin güneş alacağı yön ve açıya göre belirlenir. Bunun için sahada yapılan ücretsiz keşif ve tüketim analizi gereklidir.",
    guideSlug: "kac-kw-sistem-gerekir",
  },
  {
    question: "Çatı tipi ile cephe tipi güneş paneli arasındaki fark nedir?",
    answer:
      "Her çatı ve her cephe aynı montaj yöntemine uygun değildir. Çatı tipi kurulumlarda yüzey eğimi ve malzemesi (kiremit, sac, membran) belirleyicidir; cephe tipi uygulamalarda ise taşıyıcı sistem, bina statiğiyle uyumlu olacak şekilde ayrıca projelendirilir.",
    guideSlug: "cephe-tipi-gunes-paneli-sistemi-nedir",
  },
  {
    question: "Güneş panelleri düzenli bakım gerektirir mi?",
    answer:
      "Evet, ancak bakım ihtiyacı sınırlıdır. Panel yüzeyi, bağlantı noktaları ve inverter performansı periyodik olarak kontrol edilir; beklenmeyen bir arıza durumunda teknik ekip sahada veya uzaktan müdahale eder.",
    guideSlug: "gunes-panelleri-bakim-gerektirir-mi",
  },
  {
    question: "Güneş enerjisi sistemi kendini kaç yılda amorti eder?",
    answer:
      "Geri ödeme süresi; sistem maliyeti, tüketim profiliniz ve güncel elektrik tarifelerine göre değişir. Kesin bir rakam vermek yerine, bu hesabı keşif sonrasında hazırlanan projeye dayanarak sizinle birlikte netleştiriyoruz.",
    guideSlug: "yatirimin-geri-donusu-nasil-hesaplanir",
  },
  {
    question: "Panel ve inverter markasını kim, nasıl seçiyor?",
    answer:
      "Sistem gücü ve şebeke koşullarına uygun panel ve inverter seçimi, projelendirme aşamasında mühendislik ekibimiz tarafından yapılır; gölgeleme analizi ve verim hesabı sahaya çıkmadan önce tamamlanır.",
    guideSlug: "panel-inverter-markasi-nasil-secilir",
  },
  {
    question: "Hangi bölgelere hizmet veriyorsunuz?",
    answer:
      "Gebze ve Kocaeli genelinde keşif, projelendirme, kurulum ve bakım hizmeti veriyoruz.",
  },
  {
    question: "Ücretsiz keşif nasıl talep edilir?",
    answer:
      "İletişim sayfasındaki formu doldurarak veya doğrudan telefon / e-posta ile bize ulaşarak ücretsiz keşif talep edebilirsiniz. Ekibimiz sahaya çıkarak çatı/cephe durumunu ve elektrik altyapınızı birlikte değerlendirir.",
  },
  {
    question: "Kurulumu kim yapıyor — taşeron mu, kendi ekibiniz mi?",
    answer:
      "Taşıyıcı sistem, panel montajı, elektrik bağlantıları ve devreye alma; taşerona devredilmeden kendi saha ekibimiz tarafından, projelendirme aşamasında hazırlanan yerleşim planına göre uygulanır.",
    guideSlug: "gunes-paneli-firmasi-secerken-nelere-dikkat-edilmeli",
  },
];
