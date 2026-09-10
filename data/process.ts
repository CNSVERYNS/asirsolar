export type ProcessStep = {
  num: string;
  title: string;
  description: string;
};

export const process: ProcessStep[] = [
  {
    num: "01",
    title: "Keşif",
    description:
      "Sahaya çıkılır; çatı/cephe durumu, elektrik panosu ve bağlantı noktası birlikte incelenir.",
  },
  {
    num: "02",
    title: "Analiz",
    description:
      "Tüketim profili, taşıma kapasitesi ve gölgeleme durumu değerlendirilerek sistem büyüklüğü belirlenir.",
  },
  {
    num: "03",
    title: "Projelendirme",
    description:
      "Tek hat şeması, yerleşim planı ve teknik şartname hazırlanır.",
  },
  {
    num: "04",
    title: "Uygulama",
    description:
      "Taşıyıcı sistem, panel ve elektrik altyapısı proje dosyasına uygun şekilde sahada kurulur.",
  },
  {
    num: "05",
    title: "Devreye Alma",
    description:
      "İzolasyon, topraklama ve string ölçümleri yapılır; sistem test edilerek teslim edilir.",
  },
  {
    num: "06",
    title: "Teknik Destek",
    description:
      "Kurulum sonrasında periyodik kontrol ve gerektiğinde teknik müdahale sağlanır.",
  },
];
