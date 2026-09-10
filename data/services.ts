import type { ServiceIconKey } from "@/components/Icons";

export type Service = {
  num: string;
  slug: string;
  title: string;
  summary: string;
  description: string[];
  scope: string[];
  image: string;
  icon: ServiceIconKey;
};

export const services: Service[] = [
  {
    num: "01",
    slug: "gunes-enerjisi-sistemleri",
    title: "Güneş Enerjisi Sistemleri",
    summary:
      "Çatı, cephe ve arazi tipi fotovoltaik sistemlerin tasarımı ve kurulumu.",
    description: [
      "Binanın tükettiği enerjiyi, çatı taşıma kapasitesini ve elektrik altyapısını birlikte değerlendirerek uygun sistem büyüklüğünü belirliyoruz.",
      "Panel dizilimi, gölgeleme analizi ve verim hesabı; sahaya çıkmadan önce projelendirme aşamasında tamamlanır.",
    ],
    scope: [
      "Tüketim ve saha analizi",
      "Panel ve inverter seçimi",
      "Statik ve mekanik uygunluk değerlendirmesi",
      "Verim ve geri dönüş hesabı",
    ],
    image: "/images/stock/hero-farm.jpg",
    icon: "sun",
  },
  {
    num: "02",
    slug: "cephe-tipi-uygulamalar",
    title: "Çatı ve Cephe Tipi Uygulamalar",
    summary:
      "Standart çatı kurulumlarının yanı sıra bina cephesine entegre panel sistemleri.",
    description: [
      "Her çatı ve her cephe aynı montaj yöntemine uygun değildir. Yüzey eğimi, yön, rüzgar yükü ve estetik bütünlük birlikte değerlendirilir.",
      "Cephe tipi uygulamalarda mekanik taşıyıcı sistem, bina statiği ile uyumlu olacak şekilde ayrıca projelendirilir.",
    ],
    scope: [
      "Çatı tipi kurulumlar (kiremit, sac, membran)",
      "Cepheye entegre panel sistemleri",
      "Taşıyıcı konstrüksiyon tasarımı",
      "Rüzgar ve kar yükü hesabı",
    ],
    image: "/images/stock/panel-building.jpg",
    icon: "panel",
  },
  {
    num: "03",
    slug: "projelendirme-ve-muhendislik",
    title: "Projelendirme ve Mühendislik",
    summary: "Ücretsiz keşif ile başlayan, teknik çizim ve hesaplarla ilerleyen süreç.",
    description: [
      "Saha ziyaretinde çatı/cephe durumu, elektrik panosu ve bağlantı noktası incelenir.",
      "Keşif sonrası tek hat şeması, yerleşim planı ve teknik şartname hazırlanır; uygulama bu belgeler üzerinden yürütülür.",
    ],
    scope: [
      "Ücretsiz keşif",
      "Tek hat şeması",
      "Panel yerleşim planı",
      "Teknik şartname ve doküman hazırlığı",
    ],
    image: "/images/stock/panel-closeup.jpg",
    icon: "compass",
  },
  {
    num: "04",
    slug: "elektrik-altyapisi",
    title: "Elektrik Altyapısı ve Pano Sistemleri",
    summary: "Sistemin güvenli ve sürekli çalışması için elektrik altyapısının uyumlu hale getirilmesi.",
    description: [
      "Mevcut pano, kablolama ve koruma ekipmanları; yeni yükü kaldıracak şekilde kontrol edilir ve gerektiğinde yeniden düzenlenir.",
      "Kaçak akım koruması, aşırı gerilim koruması ve topraklama, kurulumun standart bir parçasıdır.",
    ],
    scope: [
      "Pano revizyonu ve AG dağıtım düzeni",
      "Kablolama ve kanal sistemleri",
      "Koruma ve topraklama tesisatı",
      "Sayaç ve şebeke bağlantı koordinasyonu",
    ],
    image: "/images/stock/industrial-roof.jpg",
    icon: "bolt",
  },
  {
    num: "05",
    slug: "kurulum-ve-devreye-alma",
    title: "Kurulum ve Devreye Alma",
    summary: "Mekanik montajdan elektriksel testlere kadar sahadaki uygulama süreci.",
    description: [
      "Montaj ekibi, projelendirme aşamasında hazırlanan yerleşim planını sahada birebir uygular.",
      "Devreye alma öncesinde izolasyon, topraklama ve string ölçümleri yapılır; sistem test edilerek teslim edilir.",
    ],
    scope: [
      "Taşıyıcı sistem ve panel montajı",
      "İnverter ve pano bağlantıları",
      "Elektriksel test ve ölçümler",
      "Devreye alma ve teslim",
    ],
    image: "/images/stock/worker-install.jpg",
    icon: "power",
  },
  {
    num: "06",
    slug: "bakim-ve-teknik-destek",
    title: "Bakım ve Teknik Destek",
    summary: "Kurulum sonrasında sistemin performansını koruyacak periyodik kontrol ve destek.",
    description: [
      "Panel yüzeyi, bağlantı noktaları ve inverter performansı periyodik olarak kontrol edilir.",
      "Beklenmeyen bir arıza durumunda teknik ekip sahada veya uzaktan müdahale eder.",
    ],
    scope: [
      "Periyodik performans kontrolü",
      "Bağlantı ve izolasyon kontrolleri",
      "Arıza tespiti ve müdahale",
      "Teknik danışmanlık",
    ],
    image: "/images/stock/field-array.jpg",
    icon: "shield",
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
