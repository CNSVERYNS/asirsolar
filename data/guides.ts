// Rehber — en temel, en sık aranan güneş enerjisi soruları ve dürüst,
// doğrulanabilir cevapları. Kural aynı: fiyat, geri ödeme süresi, kapasite
// eşiği gibi zamanla değişen veya doğrulanamayan rakamlar somut sayı
// yerine "hangi faktörlere bağlı olduğu" anlatılarak yanıtlanır — hiçbir
// TL tutarı, kW eşiği veya yıl vaadi uydurulmaz. Genel, yerleşik
// mühendislik bilgisi sahaya göre değerlendirilir. Mevzuat, bağlantı süreçleri
// ve üretici garantileri değişebilir; ilgili resmî kaynak veya belge kontrol edilir.
//
// İlk 30 soru: temel/orta seviye karar öncesi sorular. Sonraki 20 (ikinci
// tur): ekipman/teknoloji derinliği, depolama, performans izleme ve sanayi
// tipi özel durumlar — vergi/teşvik ve bölgesel güneşlenme rakamları gibi
// zamanla değişen veya doğrulanamayan konular bilinçli olarak dışarıda
// bırakılmıştır.

export type GuideCategory =
  | "Temel Bilgiler"
  | "Teknik"
  | "Planlama ve Kurulum"
  | "Mevzuat ve Şebeke Bağlantısı"
  | "Maliyet ve Bakım"
  | "Karar ve Genel"
  | "Ekipman ve Teknoloji"
  | "Depolama ve Şebeke Bağımsızlığı"
  | "İzleme ve Performans"
  | "İleri Projelendirme"
  | "Ticari ve Endüstriyel Uygulamalar";

export type GuideItem = {
  slug: string;
  question: string;
  category: GuideCategory;
  summary: string;
  body: string[];
  relatedServiceSlug: string;
};

export const guideItems: GuideItem[] = [
  // ---- Temel Bilgiler ----
  {
    slug: "gunes-enerjisi-sistemi-nasil-calisir",
    question: "Güneş enerjisi sistemi nasıl çalışır?",
    category: "Temel Bilgiler",
    summary:
      "Güneş panelleri ışığı doğru akıma, inverter bu akımı evde kullanılan alternatif akıma çevirir.",
    body: [
      "Güneş panelleri, üzerlerine düşen güneş ışığını fotovoltaik hücreler aracılığıyla doğrudan doğru akım (DC) elektriğe çevirir. Bu akım, tek başına ev veya işletmedeki çoğu cihaz tarafından kullanılamaz.",
      "Sistemin bir diğer temel bileşeni olan inverter, panellerden gelen doğru akımı, şebekedeki ve elektrikli cihazlardaki standart alternatif akıma (AC) dönüştürür. Üretilen enerji önce binanın kendi tüketimini karşılar; artan veya eksik kalan miktar şebeke bağlantısı üzerinden dengelenir.",
      "Sistemin verimli çalışması; panel yerleşimi, gölgeleme durumu, inverter seçimi ve elektrik altyapısının doğru boyutlandırılmasına bağlıdır — bu yüzden kurulumdan önce sahada yapılan analiz belirleyicidir.",
    ],
    relatedServiceSlug: "gunes-enerjisi-sistemleri",
  },
  {
    slug: "gunes-paneli-nedir-nelerden-olusur",
    question: "Güneş paneli nedir, nelerden oluşur?",
    category: "Temel Bilgiler",
    summary:
      "Bir güneş paneli; fotovoltaik hücreler, koruyucu cam, arka yüzey ve alüminyum çerçeveden oluşur.",
    body: [
      "Güneş paneli; ışığı elektriğe çeviren silikon bazlı fotovoltaik hücrelerin, bu hücreleri dış etkenlerden koruyan temperli cam ve arka yüzey katmanı arasına yerleştirilmesiyle oluşur. Hücreler seri/paralel bağlanarak panelin toplam gücünü (watt) belirler.",
      "Paneli çevreleyen alüminyum çerçeve, hem mekanik dayanıklılık sağlar hem de montaj sistemine sabitlenmesini mümkün kılar. Panelin arkasında, ürettiği akımı dış devreye ileten bağlantı kutusu bulunur.",
      "Bir sistemde panel tek başına yeterli değildir — inverter, montaj konstrüksiyonu, kablolama ve koruma ekipmanlarıyla birlikte bütün bir kurulum oluşturur.",
    ],
    relatedServiceSlug: "gunes-enerjisi-sistemleri",
  },
  {
    slug: "cati-tipi-gunes-paneli-sistemi-nedir",
    question: "Çatı tipi güneş paneli sistemi nedir?",
    category: "Temel Bilgiler",
    summary:
      "Panellerin bina çatısına monte edildiği, en yaygın konut ve işletme tipi kurulum şeklidir.",
    body: [
      "Çatı tipi sistemde paneller, binanın mevcut çatısına özel montaj konstrüksiyonlarıyla sabitlenir. Kiremit, sac veya membran gibi farklı çatı yüzeyleri, farklı montaj yöntemleri gerektirir.",
      "Bu sistem tipinde belirleyici olan; çatının yönü (güneye bakan yüzeyler genelde daha verimlidir), eğim açısı, gölgeleme durumu ve taşıma kapasitesidir. Uygun olmayan bir montaj yöntemi, hem panel veriminde hem çatının uzun ömründe soruna yol açabilir.",
      "Çatı tipi kurulumlar; ek arazi gerektirmemesi ve mevcut yapıyı değerlendirmesi nedeniyle konut ve sanayi çatılarında en sık tercih edilen sistem tipidir.",
    ],
    relatedServiceSlug: "cephe-tipi-uygulamalar",
  },
  {
    slug: "cephe-tipi-gunes-paneli-sistemi-nedir",
    question: "Cephe tipi güneş paneli sistemi nedir?",
    category: "Temel Bilgiler",
    summary:
      "Panellerin binanın dış duvarına, çatı yerine cepheye entegre edildiği uygulama türüdür.",
    body: [
      "Cephe tipi sistemde paneller, çatı yerine binanın düşey dış yüzeyine (cephesine) monte edilir. Bu, çatı alanı yetersiz olduğunda veya bina mimarisiyle bütünleşik bir görünüm istendiğinde tercih edilen bir yöntemdir.",
      "Cephe uygulamaları, çatı kurulumlarından farklı bir mühendislik yaklaşımı gerektirir: taşıyıcı sistem bina statiğiyle uyumlu olacak şekilde ayrıca projelendirilir, rüzgar yükü hesabı daha kritik hale gelir ve panellerin dikey açısı nedeniyle güneş alma verimi çatı tipine göre farklılaşır.",
      "Doğru uygulandığında cephe tipi sistemler, hem enerji üretimi sağlar hem de bina cephesinin bir parçası olarak işlev görür.",
    ],
    relatedServiceSlug: "cephe-tipi-uygulamalar",
  },
  {
    slug: "arazi-tipi-ges-nedir",
    question: "Arazi tipi güneş enerji santrali (GES) nedir?",
    category: "Temel Bilgiler",
    summary:
      "Panellerin bir bina üzerine değil, doğrudan zemine kurulu taşıyıcı sistemler üzerine monte edildiği, genelde büyük ölçekli kurulumlardır.",
    body: [
      "Arazi tipi GES'te paneller, çatı yerine zemine sabitlenmiş metal taşıyıcı konstrüksiyonlar üzerine dizilir. Bina yapısına bağlı olmadığı için genellikle daha büyük kapasiteli sistemler için tercih edilir.",
      "Bu sistem tipinde arazi eğimi, zemin etüdü, gölgeleme ve panel sıraları arası mesafe gibi faktörler; çatı tipi kurulumlara göre farklı bir planlama gerektirir.",
      "Arazi tipi sistemler; geniş, gölgesiz ve güneşe uygun konumlanmış bir arazisi olan işletmeler veya tarım arazileri için değerlendirilebilecek bir seçenektir.",
    ],
    relatedServiceSlug: "gunes-enerjisi-sistemleri",
  },

  // ---- Teknik ----
  {
    slug: "monokristal-polikristal-panel-farki",
    question: "Monokristal ve polikristal panel arasındaki fark nedir?",
    category: "Teknik",
    summary:
      "Monokristal paneller tek kristalli silikondan üretilir ve genelde daha yüksek verime sahiptir; polikristal paneller çok kristalli yapıdadır.",
    body: [
      "Monokristal paneller, tek bir silikon kristalinden kesilerek üretilir. Bu üretim yöntemi genellikle daha yüksek verim ve daha koyu, homojen bir görünüm sağlar; aynı alanda daha fazla güç üretebilir.",
      "Polikristal paneller ise birden fazla silikon kristalinin eritilip kalıplanmasıyla üretilir. Üretim süreci nispeten daha basittir ve panel yüzeyinde karakteristik mavi, kristalli bir doku görülür.",
      "Hangi panel tipinin bir proje için uygun olduğu; mevcut çatı/cephe alanı, hedeflenen sistem gücü ve bütçe önceliklerine göre değerlendirilir — bu değerlendirme projelendirme aşamasında yapılır.",
    ],
    relatedServiceSlug: "gunes-enerjisi-sistemleri",
  },
  {
    slug: "inverter-nedir-neden-gereklidir",
    question: "İnverter nedir, neden gereklidir?",
    category: "Teknik",
    summary:
      "İnverter, panellerin ürettiği doğru akımı, şebeke ve cihazların kullandığı alternatif akıma çeviren zorunlu bir bileşendir.",
    body: [
      "Güneş panelleri doğru akım (DC) üretir, ancak evlerde ve işletmelerde kullanılan elektrik şebekesi alternatif akımla (AC) çalışır. İnverter, bu dönüşümü yaparak üretilen enerjinin kullanılabilir hale gelmesini sağlar.",
      "İnverter aynı zamanda sistemin güvenliği için de kritiktir: şebeke kesintisinde otomatik olarak devreden çıkar, aşırı gerilim ve kaçak akım gibi durumlara karşı koruma sağlar ve sistemin anlık üretim verilerini izlemeyi mümkün kılar.",
      "İnverter kapasitesinin panel gücüyle uyumlu seçilmesi, sistemin toplam verimini doğrudan etkiler; bu seçim projelendirme aşamasında sistem büyüklüğüne göre yapılır.",
    ],
    relatedServiceSlug: "elektrik-altyapisi",
  },
  {
    slug: "gunes-paneli-verimini-neler-etkiler",
    question: "Güneş paneli verimini hangi faktörler etkiler?",
    category: "Teknik",
    summary:
      "Panel yönü ve açısı, gölgeleme, sıcaklık, yüzey temizliği ve inverter seçimi verimi doğrudan etkileyen başlıca faktörlerdir.",
    body: [
      "Panellerin güneşe bakış yönü ve eğim açısı, alınan ışık miktarını doğrudan belirler — bu yüzden yerleşim planı, kurulumdan önce gölgeleme analiziyle birlikte hazırlanır.",
      "Kısmi gölgeleme (bir bacadan, ağaçtan veya komşu binadan gelen gölge) tek bir panelin değil, bağlı olduğu string'in verimini düşürebilir. Panel yüzeyindeki toz, kir veya kar birikimi de benzer şekilde üretimi azaltır.",
      "Sıcaklık da bir faktördür: güneş panelleri yüksek sıcaklıkta beklenenin aksine biraz daha düşük verimle çalışır. Tüm bu değişkenler, doğru projelendirme ve düzenli bakımla kontrol altında tutulabilir.",
    ],
    relatedServiceSlug: "projelendirme-ve-muhendislik",
  },
  {
    slug: "gunes-panelleri-bulutlu-havada-calisir-mi",
    question: "Güneş panelleri bulutlu havada veya kışın çalışır mı?",
    category: "Teknik",
    summary:
      "Evet, paneller bulutlu havada ve kışın da üretim yapar; ancak üretim miktarı doğrudan güneş ışığı seviyesine göre azalır.",
    body: [
      "Güneş panelleri, doğrudan güneş ışığı olmadığında da dağınık ışıktan (bulutların arasından geçen ışık) elektrik üretmeye devam eder. Üretim miktarı, açık bir güne göre daha düşük olur ama sıfıra inmez.",
      "Kış aylarında güneşlenme süresinin kısalması ve güneşin ufka daha yakın açıyla doğması, günlük toplam üretimi yaz aylarına göre azaltır. Bu, sistem planlanırken yıllık ortalama üzerinden hesaba katılan normal bir dalgalanmadır.",
      "Kar yağışı panel yüzeyini geçici olarak örtebilir; panellerin eğimli montajı genellikle karın kendiliğinden kaymasına yardımcı olur.",
    ],
    relatedServiceSlug: "gunes-enerjisi-sistemleri",
  },
  {
    slug: "gunes-paneli-garanti-suresi",
    question: "Güneş paneli garanti süresi ne kadardır?",
    category: "Teknik",
    summary:
      "Panellerde genellikle hem ürün garantisi hem de uzun vadeli performans (verim) garantisi ayrı ayrı sunulur; süreler markaya göre değişir.",
    body: [
      "Güneş panelleri için üreticiler genellikle iki ayrı garanti sunar: ürün (malzeme ve işçilik) garantisi ile uzun vadeli performans garantisi. Performans garantisi, panelin belirli yıllar sonunda hâlâ başlangıç gücünün belirli bir yüzdesini üretmeye devam edeceğini taahhüt eder.",
      "Bu süreler ve oranlar panel markasına ve modeline göre değişir; bu yüzden panel seçimi yapılırken sadece fiyat değil, üreticinin garanti koşulları da değerlendirilmelidir.",
      "İnverter gibi diğer bileşenlerin garanti süreleri panellerden farklı ve genellikle daha kısadır — sistem teklifinde bu ayrımın net olması önemlidir.",
    ],
    relatedServiceSlug: "bakim-ve-teknik-destek",
  },

  // ---- Planlama ve Kurulum ----
  {
    slug: "kac-kw-sistem-gerekir",
    question: "Evim veya işletmem için kaç kW'lık sistem gerekir?",
    category: "Planlama ve Kurulum",
    summary:
      "Gereken sistem büyüklüğü; yıllık elektrik tüketimi, mevcut çatı/cephe alanı ve güneş alma durumuna göre hesaplanır.",
    body: [
      "İhtiyaç duyulan sistem gücü, tek bir standart rakamla değil; geçmiş elektrik tüketiminiz (fatura geçmişi), kullanılabilir çatı/cephe alanı ve bu alanın yönü/eğimiyle birlikte hesaplanır.",
      "Sistem çok küçük boyutlandırılırsa beklenen tasarruf sağlanamaz; gereğinden büyük boyutlandırılırsa hem ilk yatırım maliyeti hem de şebekeye aktarılan fazla enerjinin değerlendirilme şekli gereksiz yere değişir.",
      "Bu hesap, sahada yapılan keşif ve tüketim analiziyle netleşir — bu yüzden güneş enerjisi teklifleri genellikle bir keşif ziyaretiyle başlar.",
    ],
    relatedServiceSlug: "projelendirme-ve-muhendislik",
  },
  {
    slug: "gunes-paneli-kurulum-sureci-adim-adim",
    question: "Güneş paneli kurulum süreci adım adım nasıl işler?",
    category: "Planlama ve Kurulum",
    summary:
      "Süreç genel olarak keşif, analiz, projelendirme, saha uygulaması ve devreye alma aşamalarından oluşur.",
    body: [
      "İlk aşama keşiftir: çatı/cephe durumu, elektrik panosu ve bağlantı noktası sahada incelenir. Ardından tüketim profili ve taşıma kapasitesi değerlendirilerek sistem büyüklüğü belirlenir.",
      "Analiz sonrasında tek hat şeması, panel yerleşim planı ve teknik şartname hazırlanır — bu belgeler hem uygulamanın hem de resmi başvuru sürecinin referans dokümanıdır.",
      "Projelendirme tamamlandıktan sonra taşıyıcı sistem, panel montajı ve elektrik bağlantıları sahada uygulanır. Son aşamada izolasyon, topraklama ve string ölçümleri yapılarak sistem test edilir ve devreye alınır.",
    ],
    relatedServiceSlug: "kurulum-ve-devreye-alma",
  },
  {
    slug: "gunes-paneli-kurulumu-ne-kadar-surer",
    question: "Güneş paneli kurulumu ne kadar sürer?",
    category: "Planlama ve Kurulum",
    summary:
      "Süre; sistem büyüklüğü, izin/başvuru süreçleri ve saha koşullarına göre değişir — kesin takvim keşif sonrası netleşir.",
    body: [
      "Kurulum süresi tek bir sabit sayı ile ifade edilemez, çünkü süreç yalnızca panellerin montajından ibaret değildir: keşif, projelendirme, resmi başvuru/onay süreci ve saha uygulaması ayrı ayrı zaman alır.",
      "Saha uygulamasının kendisi (montaj, kablolama, bağlantı) genellikle sistem büyüklüğüne göre birkaç günden birkaç haftaya kadar sürebilirken; başvuru ve onay süreçleri kurum yoğunluğuna bağlı olarak değişkenlik gösterir.",
      "Bu yüzden net bir takvim, ancak keşif ve projelendirme sonrasında, sistemin büyüklüğü ve bölgedeki başvuru süreci netleştikten sonra verilebilir.",
    ],
    relatedServiceSlug: "kurulum-ve-devreye-alma",
  },
  {
    slug: "catim-gunes-paneline-uygun-mu",
    question: "Çatım güneş paneline uygun mu, nasıl anlarım?",
    category: "Planlama ve Kurulum",
    summary:
      "Çatının yönü, eğimi, gölgeleme durumu ve taşıma kapasitesi birlikte değerlendirilerek uygunluk belirlenir.",
    body: [
      "Bir çatının güneş paneline uygunluğu; güneye yakın bir yöne bakıp bakmadığı, eğim açısı, gölgeleme yaratacak bacalar/ağaçlar/komşu yapılar ve çatı malzemesinin (kiremit, sac, membran) montaj yöntemine uygunluğu birlikte değerlendirilerek belirlenir.",
      "Bunun yanında çatının taşıma kapasitesi de kritik bir faktördür — panel, montaj konstrüksiyonu ve kar yükü gibi ek yüklerin bina statiğiyle uyumlu olması gerekir.",
      "Bu değerlendirme, gözle kabaca yapılabilecek bir kontrol değildir; sahada yapılan bir keşifle netleştirilir.",
    ],
    relatedServiceSlug: "cephe-tipi-uygulamalar",
  },
  {
    slug: "gunes-paneli-catinin-statigini-etkiler-mi",
    question: "Güneş paneli kurulumu çatının statiğini etkiler mi?",
    category: "Planlama ve Kurulum",
    summary:
      "Doğru projelendirilmiş bir kurulum çatı statiğine zarar vermez; bunu garanti eden şey mühendislik hesabıdır.",
    body: [
      "Paneller, montaj konstrüksiyonu ve olası kar yükü, çatıya ek bir yük bindirir. Bu ek yükün bina statiğiyle uyumlu olup olmadığı, kurulumdan önce mühendislik hesabıyla değerlendirilmesi gereken bir konudur.",
      "Doğru planlanmış bir kurulumda montaj noktaları, yükü çatının taşıyıcı elemanlarına uygun şekilde dağıtacak biçimde seçilir; bu da statik açıdan sorun yaratmadan uygulamayı mümkün kılar.",
      "Cephe tipi uygulamalarda bu değerlendirme daha da belirleyicidir, çünkü taşıyıcı sistem doğrudan bina statiğiyle etkileşime girer ve ayrıca projelendirilir.",
    ],
    relatedServiceSlug: "cephe-tipi-uygulamalar",
  },

  // ---- Mevzuat ve Şebeke Bağlantısı ----
  {
    slug: "gunes-paneli-icin-izin-gerekir-mi",
    question: "Güneş paneli kurmak için izin gerekir mi?",
    category: "Mevzuat ve Şebeke Bağlantısı",
    summary:
      "Şebekeye bağlı çatı ve cephe sistemlerinde bağlantı, proje onayı ve kabul işlemleri gerekir. Başvuru yolu tesisin türüne ve ilgili şebeke işletmecisine göre belirlenir.",
    body: [
      "Türkiye’de şebekeye bağlı bir çatı veya cephe güneş enerjisi sistemi için bağlantı ve teknik onay süreçleri bulunur. Lisanssız üretim kapsamındaki işlemler, ilgili mevzuat ve yetkili şebeke işletmecisinin güncel başvuru koşullarıyla yürütülür.",
      "Başvurunun yapılması tek başına sistemi işletmeye alma izni değildir. Proje onayı, anlaşmalar, kabul ve bağlantıya ilişkin gereklilikler tesisin kapsamına göre tamamlanır.",
    ],
    relatedServiceSlug: "projelendirme-ve-muhendislik",
  },
  {
    slug: "lisanssiz-elektrik-uretimi-nedir",
    question: "Lisanssız elektrik üretimi nedir?",
    category: "Mevzuat ve Şebeke Bağlantısı",
    summary:
      "Kendi tüketimini karşılamak amacıyla, belirli koşullarda lisans almadan kurulabilen küçük ölçekli üretim tesislerini tanımlayan mevzuat çerçevesidir.",
    body: [
      "Lisanssız elektrik üretimi; bireylerin ve işletmelerin, kendi tüketimlerini karşılamak amacıyla belirli koşullar altında bir üretim lisansı almadan güneş enerjisi sistemi kurabilmesini düzenleyen mevzuat çerçevesidir. Çatı ve cephe tipi konut/işletme sistemlerinin büyük çoğunluğu bu kapsamda değerlendirilir.",
      "Bu çerçeve; başvuru süreci, bağlantı koşulları ve şebekeyle ilişkilendirme (mahsuplaşma) esaslarını belirler. Kurallar zaman içinde güncellenebildiği için, güncel koşullar başvuru sırasında ilgili dağıtım şirketiyle netleştirilir.",
      "Bu mevzuata uygun başvuru ve belgelendirme, sistemin yasal olarak devreye alınabilmesi için zorunludur.",
    ],
    relatedServiceSlug: "projelendirme-ve-muhendislik",
  },
  {
    slug: "edas-baglanti-basvurusu-nasil-yapilir",
    question: "EDAŞ bağlantı başvurusu nasıl yapılır?",
    category: "Mevzuat ve Şebeke Bağlantısı",
    summary:
      "Başvuru; sistemin teknik bilgileri ve proje belgeleriyle birlikte bölgenizdeki elektrik dağıtım şirketine yapılır.",
    body: [
      "Bağlantı başvurusu, sistemin kurulacağı bölgedeki elektrik dağıtım şirketine (EDAŞ), hazırlanan proje belgeleri (tek hat şeması, teknik şartname vb.) ile birlikte yapılır. Başvuru, dağıtım şirketi tarafından teknik açıdan değerlendirilir.",
      "Değerlendirme sonrası onay verilmesi durumunda, mevcut sayaç sistemin ürettiği ve şebekeden çektiği enerjiyi ölçebilecek bir sayaçla değiştirilir veya buna uygun hale getirilir.",
      "Bu sürecin doğru belge ve teknik hesaplarla yürütülmesi, başvurunun gecikmeden sonuçlanması açısından önemlidir — bu koordinasyon projelendirme sürecinin bir parçasıdır.",
    ],
    relatedServiceSlug: "elektrik-altyapisi",
  },
  {
    slug: "mahsuplasma-net-metering-nedir",
    question: "Mahsuplaşma (net metering) nedir, nasıl çalışır?",
    category: "Mevzuat ve Şebeke Bağlantısı",
    summary:
      "Sistemin ürettiği ancak anlık tüketilmeyen enerjinin şebekeye verilip, ihtiyaç anında şebekeden çekilen enerjiyle karşılıklı mahsup edildiği mekanizmadır.",
    body: [
      "Güneş panelleri, güneşin en güçlü olduğu saatlerde binanın anlık ihtiyacından daha fazla enerji üretebilir. Mahsuplaşma mekanizması, bu fazla enerjinin şebekeye aktarılmasını ve güneşin olmadığı saatlerde şebekeden çekilen enerjiyle karşılıklı olarak hesaplanmasını sağlar.",
      "Bu sayede sistem sahibi, ürettiği enerjiyi depolamak zorunda kalmadan, şebekeyi bir tür dengeleme aracı olarak kullanabilir. Hesaplama dönemi ve koşulları, ilgili mevzuat ve dağıtım şirketinin uygulamasına göre belirlenir.",
      "Mahsuplaşmanın nasıl işleyeceği, bağlantı başvurusu onaylandıktan sonra sayaç ve sözleşme koşullarıyla birlikte netleşir.",
    ],
    relatedServiceSlug: "elektrik-altyapisi",
  },
  {
    slug: "sebekeye-verilen-fazla-enerji-ne-oluyor",
    question: "Şebekeye verilen fazla enerjiye ne oluyor?",
    category: "Mevzuat ve Şebeke Bağlantısı",
    summary:
      "Fazla enerji şebekeye aktarılır ve mahsuplaşma mekanizmasıyla, ihtiyaç anında şebekeden çekilen enerjiyle dengelenir.",
    body: [
      "Sisteminizin ürettiği ancak o anda tüketilmeyen enerji, doğrudan elektrik şebekesine aktarılır. Bu enerji kaybolmaz; iki yönlü ölçüm yapabilen sayaç üzerinden kayıt altına alınır.",
      "Kayıt altına alınan bu fazla üretim, mahsuplaşma dönemi içinde şebekeden çekilen enerjiyle karşılıklı olarak hesaplanır. Dönem sonunda net tüketim veya net üretim durumuna göre faturalandırma yapılır.",
      "Bu mekanizmanın işleyiş detayları (dönem uzunluğu, hesaplama yöntemi), bağlantı başvurusu sırasında dağıtım şirketiyle netleşen sözleşme koşullarına bağlıdır.",
    ],
    relatedServiceSlug: "elektrik-altyapisi",
  },

  // ---- Maliyet ve Bakım ----
  {
    slug: "gunes-paneli-fiyatini-neler-belirler",
    question: "Güneş paneli fiyatını hangi faktörler belirler?",
    category: "Maliyet ve Bakım",
    summary:
      "Sistem büyüklüğü, panel/inverter markası, montaj yöntemi, elektrik altyapısı revizyonu ve başvuru süreçleri toplam maliyeti belirleyen ana kalemlerdir.",
    body: [
      "Toplam maliyet; kurulacak sistemin gücü (kaç kW), seçilen panel ve inverter markası/modeli, montaj yönteminin karmaşıklığı (çatı tipi, malzemesi veya cephe uygulaması) gibi faktörlere göre değişir.",
      "Buna ek olarak elektrik altyapısının mevcut durumu da belirleyicidir: pano revizyonu, kablolama ve koruma ekipmanlarının yenilenmesi gerekip gerekmediği toplam bütçeyi etkiler. İzin ve başvuru süreçleri de projeye dahil olan kalemlerdendir.",
      "Bu değişkenlerin çokluğu nedeniyle güvenilir bir fiyat, ancak saha koşulları görüldükten ve ihtiyaç netleştikten sonra, somut bir teklifle verilebilir.",
    ],
    relatedServiceSlug: "projelendirme-ve-muhendislik",
  },
  {
    slug: "yatirimin-geri-donusu-nasil-hesaplanir",
    question: "Güneş enerjisi sistemi yatırımının geri dönüşü nasıl hesaplanır?",
    category: "Maliyet ve Bakım",
    summary:
      "Geri dönüş süresi; sistem maliyeti, gerçek tüketim profili ve güncel elektrik tarifelerinin birlikte değerlendirilmesiyle hesaplanır.",
    body: [
      "Geri ödeme süresi hesaplanırken; sistemin toplam kurulum maliyeti, beklenen yıllık üretim miktarı ve bu üretimin güncel elektrik tarifeleri üzerinden ifade ettiği tasarruf/gelir birlikte değerlendirilir.",
      "Elektrik tarifeleri zamanla değiştiği ve tüketim profili her bina için farklı olduğu için, geri dönüş süresi genel bir ortalama yerine, sizin faturalarınıza ve sahanıza özgü bir hesapla anlamlı hale gelir.",
      "Bu nedenle güvenilir bir geri dönüş hesabı, keşif sonrasında hazırlanan proje ve güncel tarifeler üzerinden sunulur; genel bir rakamla önceden vaat edilmesi yanıltıcı olur.",
    ],
    relatedServiceSlug: "projelendirme-ve-muhendislik",
  },
  {
    slug: "gunes-panelleri-bakim-gerektirir-mi",
    question: "Güneş panelleri düzenli bakım gerektirir mi?",
    category: "Maliyet ve Bakım",
    summary:
      "Evet, ancak bakım ihtiyacı sınırlıdır: periyodik yüzey kontrolü, bağlantı kontrolü ve inverter performans takibi yeterlidir.",
    body: [
      "Güneş panellerinin hareketli parçası olmadığı için bakım ihtiyacı, örneğin bir jeneratöre kıyasla oldukça sınırlıdır. Buna rağmen periyodik kontrol, sistemin uzun vadeli performansını korumak açısından önemlidir.",
      "Düzenli bakımın kapsamı genellikle şunları içerir: panel yüzeyinin toz/kir birikimi açısından kontrolü, elektriksel bağlantı noktalarının gözden geçirilmesi ve inverterin performans verilerinin izlenmesi.",
      "Beklenmeyen bir performans düşüşü veya arıza durumunda, sorunun sahada mı yoksa uzaktan mı müdahale gerektirdiği inverter verileri üzerinden genellikle önceden tespit edilebilir.",
    ],
    relatedServiceSlug: "bakim-ve-teknik-destek",
  },
  {
    slug: "kar-dolu-firtina-panellere-zarar-verir-mi",
    question: "Kar, dolu veya fırtına panellere zarar verir mi?",
    category: "Maliyet ve Bakım",
    summary:
      "Paneller belirli standartlara göre dayanıklılık testlerinden geçirilir; doğru monte edilmiş bir sistem normal hava koşullarına dayanacak şekilde tasarlanır.",
    body: [
      "Güneş panelleri, üretim aşamasında dolu darbesi, rüzgar yükü ve kar yükü gibi çevresel etkenlere karşı belirli standartlara uygun şekilde test edilir. Panelin koruyucu camı bu tür darbelere dayanacak şekilde tasarlanmıştır.",
      "Sistemin dayanıklılığı yalnızca panelin kendisine değil, montaj konstrüksiyonunun doğru rüzgar ve kar yükü hesabıyla kurulmasına da bağlıdır — bu hesap projelendirme aşamasında yapılır.",
      "Aşırı ve istisnai hava olayları her yapıda olduğu gibi risk taşısa da, doğru projelendirilmiş ve monte edilmiş bir sistem, bölgenin normal hava koşullarına dayanacak şekilde planlanır.",
    ],
    relatedServiceSlug: "bakim-ve-teknik-destek",
  },
  {
    slug: "kacak-akim-korumasi-topraklama-neden-onemli",
    question: "Kaçak akım koruması ve topraklama neden önemlidir?",
    category: "Maliyet ve Bakım",
    summary:
      "Bu koruma ekipmanları, sistemi ve binadaki kullanıcıları elektriksel arıza durumlarına karşı korur; kurulumun standart bir parçasıdır.",
    body: [
      "Kaçak akım koruması, sistemde beklenmeyen bir izolasyon hatası oluştuğunda devreyi otomatik olarak keserek hem ekipmanı hem de binadaki kişileri korur. Bu, elektrik güvenliğinin temel unsurlarından biridir.",
      "Topraklama ise sistemde oluşabilecek aşırı gerilimin güvenli bir şekilde toprağa aktarılmasını sağlar; hem panel/inverter ekipmanının hem de bina elektrik tesisatının korunmasına katkıda bulunur.",
      "Bu koruma tesisatı, isteğe bağlı bir ek değil, güneş enerjisi sistemi kurulumunun standart ve zorunlu bir parçasıdır.",
    ],
    relatedServiceSlug: "elektrik-altyapisi",
  },

  // ---- Karar ve Genel ----
  {
    slug: "elektrik-kesintisinde-sistem-calisir-mi",
    question: "Güneş enerjisi sistemi elektrik kesintisinde çalışır mı?",
    category: "Karar ve Genel",
    summary:
      "Şebekeye bağlı standart sistemler, güvenlik nedeniyle şebeke kesintisinde otomatik olarak devre dışı kalır; kesintisiz çalışma için ayrı bir depolama/donanım gerekir.",
    body: [
      "Şebekeye bağlı (on-grid) standart güneş enerjisi sistemleri, şebeke kesildiğinde güvenlik amacıyla otomatik olarak üretimi durdurur. Bunun nedeni, şebekede çalışan teknisyenlerin, hattın gerçekten enerjisiz olduğundan emin olabilmesidir.",
      "Kesinti sırasında da elektrik kullanmaya devam edebilmek için, sisteme ayrıca bir enerji depolama (batarya) ve buna uygun bir inverter/kontrol donanımı eklenmesi gerekir. Bu, standart bir şebeke bağlantılı kurulumdan farklı, ek bir yatırım ve planlama gerektiren bir seçenektir.",
      "Bu tür bir ihtiyacınız varsa, sistemin başlangıçta buna uygun tasarlanması gerekir; bu yüzden proje kapsamı belirlenirken bu tercih netleştirilmelidir.",
    ],
    relatedServiceSlug: "elektrik-altyapisi",
  },
  {
    slug: "panel-inverter-markasi-nasil-secilir",
    question: "Panel ve inverter markası nasıl seçilir?",
    category: "Karar ve Genel",
    summary:
      "Seçim; sistem gücü, şebeke koşulları, garanti kapsamı ve saha koşullarına uygunluk değerlendirilerek projelendirme aşamasında yapılır.",
    body: [
      "Panel ve inverter seçimi yalnızca marka tercihinden ibaret değildir; sistemin toplam gücü, şebeke bağlantı koşulları ve sahanın fiziksel özellikleri (alan, gölgeleme, sıcaklık) birlikte değerlendirilerek yapılır.",
      "Garanti kapsamı ve süresi, üreticinin teknik destek ağı ve ekipmanın yerel şebeke standartlarına uygunluğu da seçimde dikkate alınması gereken faktörlerdir.",
      "Bu değerlendirme, sahaya çıkmadan önce projelendirme aşamasında yapılır; amaç en ucuz değil, o proje için en uygun ve güvenilir kombinasyonu belirlemektir.",
    ],
    relatedServiceSlug: "projelendirme-ve-muhendislik",
  },
  {
    slug: "gunes-paneli-firmasi-secerken-nelere-dikkat-edilmeli",
    question: "Güneş paneli kurulum firması seçerken nelere dikkat edilmeli?",
    category: "Karar ve Genel",
    summary:
      "Firmanın keşiften devreye almaya kadar süreci kendi ekibiyle mi yürüttüğü, projelendirme yapıp yapmadığı ve garanti/destek koşulları önemli kriterlerdir.",
    body: [
      "İlk dikkat edilmesi gereken nokta, firmanın süreci yalnızca panel satan bir tedarikçi olarak mı, yoksa keşif, projelendirme, uygulama ve devreye almayı kapsayan bir mühendislik hizmeti olarak mı sunduğudur. Bu ayrım, sistemin doğru boyutlandırılıp boyutlandırılmadığını doğrudan etkiler.",
      "Kurulumun taşerona mı devredildiği yoksa firmanın kendi saha ekibi tarafından mı yapıldığı, uygulama kalitesi ve sonrasındaki sorumluluk açısından önemli bir farktır.",
      "Son olarak; verilen tekliflerin somut bir keşfe mi yoksa genel bir tahmine mi dayandığı, ve kurulum sonrası bakım/teknik destek kapsamının ne olduğu sorgulanmalıdır. Ciddi bir firma, kesin rakamları keşif yapmadan önce vaat etmez.",
    ],
    relatedServiceSlug: "kurulum-ve-devreye-alma",
  },
  {
    slug: "gunes-enerjisinin-cevresel-faydalari",
    question: "Güneş enerjisinin çevresel faydaları nelerdir?",
    category: "Karar ve Genel",
    summary:
      "Güneş enerjisi, çalışması sırasında doğrudan sera gazı emisyonu üretmeyen, tükenmez bir kaynaktan elektrik üretimi sağlar.",
    body: [
      "Güneş panelleri, elektrik üretimi sırasında yakıt tüketmez ve doğrudan sera gazı salımı yapmaz. Bu, fosil yakıtlarla çalışan üretim yöntemlerine kıyasla temel bir farktır.",
      "Güneş, insan ölçeğinde tükenmez bir enerji kaynağıdır; bu nedenle güneş enerjisi sistemleri yenilenebilir enerji kaynakları arasında sayılır.",
      "Bir binanın kendi tükettiği enerjinin bir kısmını yerinde üretmesi, aynı zamanda elektrik iletim hatlarındaki kayıpları da azaltan, dağıtık üretim modeline katkı sağlayan bir yaklaşımdır.",
    ],
    relatedServiceSlug: "gunes-enerjisi-sistemleri",
  },
  {
    slug: "konut-ticari-sistem-farki",
    question: "Konut ile ticari/endüstriyel güneş enerjisi sistemi arasındaki fark nedir?",
    category: "Karar ve Genel",
    summary:
      "Fark yalnızca ölçekte değil; tüketim profili, çatı/alan tipi ve elektrik altyapısının karmaşıklığında da ortaya çıkar.",
    body: [
      "Konut tipi sistemler genellikle daha küçük ölçekli olup, hane halkının tüketim profiline göre boyutlandırılır ve çatı tipi kurulumlar yaygındır.",
      "Ticari ve endüstriyel sistemlerde ise tüketim profili gün içinde daha yoğun ve öngörülebilir olabilir; çatı alanları genellikle daha büyüktür ve bina elektrik altyapısı (pano, dağıtım hattı) daha karmaşık olduğundan projelendirme aşamasında daha kapsamlı bir mühendislik değerlendirmesi gerekir.",
      "Her iki durumda da temel süreç aynıdır — keşif, analiz, projelendirme, uygulama, devreye alma — ancak ölçek büyüdükçe teknik detayların ve koordinasyonun önemi artar.",
    ],
    relatedServiceSlug: "gunes-enerjisi-sistemleri",
  },

  // ---- Ekipman ve Teknoloji ----
  {
    slug: "half-cell-panel-nedir",
    question: "Half-cell (yarı hücreli) panel nedir, avantajı nedir?",
    category: "Ekipman ve Teknoloji",
    summary:
      "Standart hücrelerin ikiye kesilmesiyle üretilen half-cell paneller, kısmi gölgelemede daha az verim kaybı ve daha düşük direnç kaybı sağlar.",
    body: [
      "Half-cell panellerde, standart tam boy fotovoltaik hücreler ikiye kesilerek kullanılır. Bu, panel içindeki elektrik akımının yolunu kısaltarak dirençten kaynaklanan kayıpları azaltır.",
      "Daha önemlisi, kısmi gölgeleme durumunda (örneğin panelin bir kısmına bir bacadan gölge düşmesi) half-cell tasarım, panelin tamamının değil yalnızca etkilenen bölümünün üretim kaybetmesini sağlayacak şekilde devrelenebilir.",
      "Bu özellikler, özellikle gölgelenme riski olan çatılarda half-cell panelleri değerlendirmeye değer kılar; hangi panel tipinin bir proje için uygun olduğu projelendirme aşamasında saha koşullarına göre belirlenir.",
    ],
    relatedServiceSlug: "gunes-enerjisi-sistemleri",
  },
  {
    slug: "bifacial-panel-nedir",
    question: "Bifacial (çift yüzeyli) panel nedir?",
    category: "Ekipman ve Teknoloji",
    summary:
      "Hem ön hem arka yüzeyinden ışık toplayabilen bifacial paneller, yansıyan ışığın da değerlendirilebildiği zeminlerde ek üretim sağlayabilir.",
    body: [
      "Standart panellerin aksine bifacial (çift yüzeyli) paneller, hem doğrudan üstlerine düşen güneş ışığından hem de altlarındaki zeminden yansıyan ışıktan elektrik üretebilecek şekilde tasarlanır.",
      "Bu ek üretim; zeminin yansıtıcılığına (açık renkli çakıl, beton gibi), montaj yüksekliğine ve panelin açısına bağlı olarak değişir. Koyu renkli bir çatı yüzeyinde bu avantaj sınırlı kalabilir.",
      "Bifacial panellerin bir projede anlamlı bir fark yaratıp yaratmayacağı, montaj yüzeyinin özelliklerine bağlı olduğu için saha değerlendirmesiyle netleşir.",
    ],
    relatedServiceSlug: "gunes-enerjisi-sistemleri",
  },
  {
    slug: "string-inverter-mikroinverter-farki",
    question: "String inverter ile mikroinverter arasındaki fark nedir?",
    category: "Ekipman ve Teknoloji",
    summary:
      "String inverter panel gruplarını tek bir cihazdan yönetir; mikroinverter her paneli ayrı ayrı dönüştürür ve gölgelemeye karşı daha esnektir.",
    body: [
      "String inverter yönteminde, seri bağlı bir panel grubunun (string) ürettiği doğru akım, tek bir merkezi inverter üzerinden alternatif akıma çevrilir. Bu, çoğu standart konut ve işletme kurulumunda kullanılan yaygın yöntemdir.",
      "Mikroinverter yönteminde ise her panelin arkasına küçük, ayrı bir inverter yerleştirilir. Bu sayede bir paneldeki gölgeleme veya performans düşüşü, string'deki diğer panelleri etkilemez — her panel bağımsız çalışır.",
      "Mikroinverterler genellikle karmaşık gölgeleme koşulları olan çatılarda avantaj sağlarken, string inverterler daha basit ve düz güneş alan geniş yüzeylerde yaygın ve ekonomik bir tercihtir. Seçim, çatının koşullarına göre yapılır.",
    ],
    relatedServiceSlug: "elektrik-altyapisi",
  },
  {
    slug: "optimizer-nedir-ne-ise-yarar",
    question: "Optimizer (güç optimize edici) nedir, ne işe yarar?",
    category: "Ekipman ve Teknoloji",
    summary:
      "Her panelin arkasına takılan optimizer, string inverter sisteminde panel bazında verim kaybını azaltan bir ara çözümdür.",
    body: [
      "Güç optimize edici (optimizer), her panelin arkasına takılan ve panelin çıkışını string'e aktarmadan önce düzenleyen bir cihazdır. Merkezi bir string inverter ile birlikte çalışır.",
      "Amacı, bir string inverterin sahip olduğu ekonomik avantajı korurken, mikroinverterin sunduğu panel bazlı esnekliğin bir kısmını yakalamaktır — özellikle kısmi gölgelemenin bulunduğu sistemlerde string genelindeki kaybı azaltır.",
      "Optimizerin bir projede gerekip gerekmediği, çatının gölgeleme profiline ve panel yerleşimine bağlıdır; bu değerlendirme projelendirme aşamasında yapılır.",
    ],
    relatedServiceSlug: "elektrik-altyapisi",
  },
  {
    slug: "panel-gucu-wp-peak-watt-ne-anlama-gelir",
    question: "Panel gücü (Wp / peak watt) ne anlama gelir?",
    category: "Ekipman ve Teknoloji",
    summary:
      "Wp (watt-peak), bir panelin standart test koşullarında üretebileceği maksimum gücü ifade eder; gerçek sahada üretim buna göre değişkenlik gösterir.",
    body: [
      "Bir panelin üzerinde yazan güç değeri (örneğin 550 Wp), o panelin laboratuvar ortamında tanımlanmış standart test koşulları (belirli ışık şiddeti, açı ve sıcaklık) altında üretebileceği maksimum gücü ifade eder.",
      "Sahadaki gerçek üretim; anlık güneş ışığı seviyesi, sıcaklık, panelin açısı ve gölgeleme gibi değişkenlere göre bu değerin altında veya günün belirli anlarında yakınında seyreder.",
      "Bir sistemin toplam kurulu gücü, kullanılan panel sayısının Wp değeriyle çarpılmasıyla ifade edilir; ancak yıllık gerçek üretim tahmini için saha koşullarının ayrıca değerlendirilmesi gerekir.",
    ],
    relatedServiceSlug: "gunes-enerjisi-sistemleri",
  },

  // ---- Depolama ve Şebeke Bağımsızlığı ----
  {
    slug: "batarya-depolama-sistemi-ne-zaman-gerekir",
    question: "Batarya (enerji depolama) sistemi ne zaman gerekir?",
    category: "Depolama ve Şebeke Bağımsızlığı",
    summary:
      "Standart şebeke bağlantılı sistemlerde batarya zorunlu değildir; kesintide elektriksiz kalmak istemeyen veya şebekeden bağımsız çalışmak isteyenler için değerlendirilir.",
    body: [
      "Şebekeye bağlı (on-grid) standart bir güneş enerjisi sisteminde batarya zorunlu bir bileşen değildir; üretilen fazla enerji mahsuplaşma yoluyla şebeke üzerinden değerlendirilir.",
      "Batarya, şebeke kesintisinde de elektrik kullanmaya devam etmek istendiğinde veya şebekeden tamamen bağımsız (off-grid) bir kurulum hedeflendiğinde gündeme gelir. Bu, sistemin başlangıçta buna uygun tasarlanmasını gerektiren ayrı bir yatırım kalemidir.",
      "Bataryalı bir sistemin gerekip gerekmediği; kesinti sıklığınız, kritik yük ihtiyacınız (örneğin sürekli çalışması gereken bir ekipman) ve bütçe önceliklerinize bağlı olarak değerlendirilir.",
    ],
    relatedServiceSlug: "elektrik-altyapisi",
  },
  {
    slug: "off-grid-sistem-nedir",
    question: "Off-grid (şebekeden bağımsız) sistem nedir, kimler için uygundur?",
    category: "Depolama ve Şebeke Bağımsızlığı",
    summary:
      "Off-grid sistemler, elektrik şebekesi bağlantısı olmayan veya bağlantısız çalışmak istenen yerlerde, üretilen enerjinin bataryada depolanmasıyla çalışır.",
    body: [
      "Off-grid sistem, elektrik şebekesine hiç bağlı olmayan bir kurulumdur. Güneşin olduğu saatlerde üretilen enerjinin bir kısmı anlık tüketilir, kalanı bataryada depolanarak güneşin olmadığı saatlerde kullanılır.",
      "Bu sistem tipi; şebeke hattının ulaşmadığı uzak bir arazi, yayla evi veya benzeri bir yapı gibi, şebeke bağlantısının mümkün olmadığı veya tercih edilmediği durumlar için değerlendirilir.",
      "Off-grid bir sistem, şebekeye bağlı bir sistemden farklı olarak tüm yıl boyunca ihtiyacı tek başına karşılayacak şekilde (batarya kapasitesi dahil) daha dikkatli boyutlandırılmalıdır — çünkü şebeke gibi bir yedek kaynak yoktur.",
    ],
    relatedServiceSlug: "elektrik-altyapisi",
  },
  {
    slug: "akilli-sayac-nedir",
    question: "Akıllı sayaç nedir, güneş enerjisi sisteminde nasıl kullanılır?",
    category: "Depolama ve Şebeke Bağımsızlığı",
    summary:
      "Akıllı (çift yönlü) sayaç, hem şebekeden çekilen hem şebekeye verilen enerjiyi ayrı ayrı ölçerek mahsuplaşma hesabının temelini oluşturur.",
    body: [
      "Standart elektrik sayaçları yalnızca tek yönde, şebekeden çekilen enerjiyi ölçer. Güneş enerjisi sistemi kurulan bir binada ise hem şebekeden çekilen hem şebekeye aktarılan enerjinin ayrı ayrı ölçülmesi gerekir.",
      "Bu ihtiyacı karşılayan çift yönlü (akıllı) sayaç, bağlantı başvurusu onaylandıktan sonra dağıtım şirketi tarafından mevcut sayacın yerine takılır veya buna uygun hale getirilir.",
      "Bu sayaçtan alınan veriler, mahsuplaşma döneminde net tüketim/üretim hesabının ve faturalandırmanın temelini oluşturur.",
    ],
    relatedServiceSlug: "elektrik-altyapisi",
  },

  // ---- İzleme ve Performans ----
  {
    slug: "panel-verimi-zamanla-ne-kadar-duser",
    question: "Panel verimi zamanla ne kadar düşer (degradasyon)?",
    category: "İzleme ve Performans",
    summary:
      "Güneş panelleri yıllar içinde çok az, öngörülebilir bir oranda verim kaybeder; bu oran üreticinin performans garantisinde belirtilir.",
    body: [
      "Güneş panelleri, kullanım ömrü boyunca yılda çok küçük ve öngörülebilir bir oranda verim kaybeder. Bu doğal sürece degradasyon denir ve panelin fiziksel yapısının kaçınılmaz bir sonucudur.",
      "Üreticiler bu kaybı, panelin belirli yıllar sonunda başlangıç gücünün en az yüzde kaçını üretmeye devam edeceğini taahhüt eden performans garantisiyle belgelendirir. Bu oran markaya ve panel teknolojisine göre değişir.",
      "Bu yüzden panel seçiminde yalnızca ilk güç değeri değil, üreticinin sunduğu performans garantisinin süresi ve koşulları da değerlendirilmelidir.",
    ],
    relatedServiceSlug: "bakim-ve-teknik-destek",
  },
  {
    slug: "sistem-performansi-nasil-izlenir",
    question: "Güneş enerjisi sistemi performansı nasıl izlenir?",
    category: "İzleme ve Performans",
    summary:
      "Modern inverterler, anlık ve geçmiş üretim verilerini bir uygulama veya web paneli üzerinden görüntülemeyi mümkün kılar.",
    body: [
      "Çoğu modern inverter, ürettiği enerjiyi anlık olarak ölçer ve bu veriyi bir mobil uygulama veya web arayüzü üzerinden sistem sahibiyle paylaşır. Bu sayede günlük, aylık ve yıllık üretim takip edilebilir.",
      "Bu izleme, yalnızca merak amaçlı değildir: beklenen üretimin altına düşen bir sistem, bir arızanın veya performans sorununun erken tespit edilmesini sağlar — genellikle sorun büyümeden fark edilir.",
      "Kurulum sonrası bu izleme verilerinin nasıl takip edileceği ve bir anormallik durumunda kimin bilgilendirileceği, teslim aşamasında netleştirilmesi gereken bir konudur.",
    ],
    relatedServiceSlug: "bakim-ve-teknik-destek",
  },
  {
    slug: "inverter-arizasi-belirtileri",
    question: "İnverter arızası belirtileri nelerdir?",
    category: "İzleme ve Performans",
    summary:
      "Beklenmedik üretim düşüşü, inverter ekranında hata kodu veya cihazın tamamen kapanması, en yaygın arıza belirtileridir.",
    body: [
      "En sık karşılaşılan belirti, izleme verilerinde görülen ani ve açıklanamayan üretim düşüşüdür — özellikle hava koşulları normalken bu bir sinyal olabilir.",
      "İnverterin kendi ekranında veya bağlı uygulamada görülen hata kodları, cihazın belirli bir sorunu (aşırı ısınma, şebeke uyumsuzluğu, izolasyon hatası gibi) tespit ettiğini gösterir. İnverterin tamamen kapanması veya yeniden başlamaması da açık bir arıza belirtisidir.",
      "Bu belirtilerden herhangi biri fark edildiğinde, sistemin kendi kendine onarılmaya çalışılması önerilmez — teknik ekip tarafından uzaktan veya sahada değerlendirilmesi gerekir.",
    ],
    relatedServiceSlug: "bakim-ve-teknik-destek",
  },
  {
    slug: "panelleri-kendim-temizleyebilir-miyim",
    question: "Panelleri kendim temizleyebilir miyim?",
    category: "İzleme ve Performans",
    summary:
      "Basit yüzey temizliği mümkündür ancak çatıya çıkmak güvenlik riski taşır; eğimli veya yüksek kurulumlarda profesyonel destek önerilir.",
    body: [
      "Panel yüzeyindeki toz birikimi, çoğu bölgede yağmurla büyük ölçüde kendiliğinden temizlenir. Buna rağmen kuru ve tozlu dönemlerde, yumuşak bir fırça ve su ile yapılan basit bir temizlik verimi artırabilir.",
      "Buradaki asıl risk temizlik işleminin kendisinden çok, çatıya çıkma ihtiyacıdır — özellikle eğimli veya yüksek çatılarda bu, ciddi bir güvenlik riski taşır ve uygun ekipman/deneyim gerektirir.",
      "Erişimi zor veya yüksek kurulumlarda, temizlik ve genel kontrolün periyodik bakım kapsamında profesyonel bir ekip tarafından yapılması hem güvenlik hem de panellere zarar vermeme açısından önerilir.",
    ],
    relatedServiceSlug: "bakim-ve-teknik-destek",
  },
  {
    slug: "inverter-kac-yilda-bir-degisir",
    question: "İnverter kaç yılda bir değişir?",
    category: "İzleme ve Performans",
    summary:
      "İnverterler genellikle panellerden daha kısa ömürlüdür ve sistemin toplam kullanım süresi içinde bir kez değişim ihtiyacı doğabilir.",
    body: [
      "Güneş panelleri onlarca yıl performans garantisiyle üretilirken, inverterler elektronik bir cihaz olarak genellikle daha kısa bir kullanım ömrüne sahiptir ve garanti süreleri panellerden daha kısadır.",
      "Bu, sistemin toplam kullanım ömrü boyunca inverterin bir kez değiştirilmesi ihtimalinin, panelin değiştirilmesine göre daha yüksek olduğu anlamına gelir. Bu, planlanabilir ve bütçelenebilir bir bakım kalemidir.",
      "İzleme verileri üzerinden takip edilen düşen performans veya artan hata sıklığı, bir inverterin ömrünün sonuna yaklaştığının erken göstergesi olabilir.",
    ],
    relatedServiceSlug: "bakim-ve-teknik-destek",
  },

  // ---- İleri Projelendirme ----
  {
    slug: "panel-acisi-yonu-nasil-optimize-edilir",
    question: "Panel açısı ve yönü nasıl optimize edilir?",
    category: "İleri Projelendirme",
    summary:
      "Panellerin yönü ve eğim açısı; çatının mevcut geometrisi ile yıl boyunca alınacak toplam güneş ışığı dengelenerek belirlenir.",
    body: [
      "Kuzey yarımkürede güneye bakan yüzeyler, genellikle yıl boyunca en fazla güneş ışığını alır. Ancak her çatı bu ideal yönde değildir; doğu veya batıya bakan yüzeyler de, farklı bir günlük üretim eğrisiyle değerlendirmeye alınabilir.",
      "Eğim açısı ise, panelin güneş ışığını yıl boyunca en dengeli şekilde karşılayacağı açıyla, mevcut çatı eğimi arasında bir uzlaşmadır — çatı tipi kurulumlarda panel genellikle çatının kendi eğimini takip eder.",
      "Bu optimizasyon, tek bir ideal sayı yerine; bulunduğunuz enlem, çatının mevcut yönü/eğimi ve gölgeleme durumu birlikte değerlendirilerek, projelendirme aşamasında sahaya özel yapılır.",
    ],
    relatedServiceSlug: "projelendirme-ve-muhendislik",
  },
  {
    slug: "golgeleme-analizi-nasil-yapilir",
    question: "Gölgeleme analizi nasıl yapılır?",
    category: "İleri Projelendirme",
    summary:
      "Gölgeleme analizi; bacalar, ağaçlar ve komşu yapılar gibi engellerin gün ve yıl boyunca panellere düşürdüğü gölgenin saha ölçümü ve modellemeyle değerlendirilmesidir.",
    body: [
      "Gölgeleme analizinde; bacalar, anten direkleri, ağaçlar ve komşu binalar gibi sabit engellerin, güneşin gün içinde ve yıl boyunca değişen konumuna göre panellere ne zaman ve ne kadar gölge düşüreceği değerlendirilir.",
      "Bu değerlendirme sahada yapılan ölçümler ve gözlemlerle desteklenir; amaç yalnızca gölgeli alanları tespit etmek değil, panel ve string yerleşimini bu gölgelerin etkisini en aza indirecek şekilde planlamaktır.",
      "İhmal edilen bir gölgeleme analizi, tek bir panelin değil bağlı olduğu tüm string'in veriminin düşmesine yol açabilir — bu yüzden yerleşim planından önce tamamlanması gereken bir adımdır.",
    ],
    relatedServiceSlug: "projelendirme-ve-muhendislik",
  },
  {
    slug: "string-tasarimi-nedir",
    question: "String tasarımı nedir, neden önemlidir?",
    category: "İleri Projelendirme",
    summary:
      "String tasarımı, panellerin hangi gruplar halinde seri bağlanacağının planlanmasıdır; doğru yapılmadığında gölgeleme veya yön farkı tüm grubun verimini düşürebilir.",
    body: [
      "Bir sistemdeki paneller genellikle tek tek değil, seri bağlı gruplar (string) halinde inverter'a bağlanır. String tasarımı, hangi panellerin birlikte gruplanacağının planlanmasıdır.",
      "Aynı string içindeki paneller, ideal olarak benzer güneş alma koşullarına (aynı yön, açı ve gölgeleme durumu) sahip olmalıdır — çünkü bir string inverter sisteminde, gruptaki en düşük performanslı panel, tüm grubun verimini o seviyeye çekebilir.",
      "Bu yüzden farklı yönlere bakan çatı yüzeyleri veya kısmi gölgelenen bölgeler varsa, bunların ayrı string'lere veya uygun ekipmana (bkz. optimizer/mikroinverter) ayrılması gerekir — bu karar projelendirme aşamasında verilir.",
    ],
    relatedServiceSlug: "projelendirme-ve-muhendislik",
  },

  // ---- Ticari ve Endüstriyel Uygulamalar ----
  {
    slug: "fabrika-depo-catisina-kurulumda-nelere-dikkat-edilir",
    question: "Fabrika veya depo çatısına güneş paneli kurulumunda nelere dikkat edilir?",
    category: "Ticari ve Endüstriyel Uygulamalar",
    summary:
      "Sanayi tipi çatılarda taşıma kapasitesi, çatı malzemesi (sandviç panel, trapez sac), mevcut çatı ekipmanları ve iş güvenliği önceliklidir.",
    body: [
      "Sanayi yapılarında sıkça kullanılan trapez sac veya sandviç panel çatılar, konut çatılarından farklı montaj yöntemleri gerektirir; panel yükünün mevcut taşıyıcı sisteme uygun şekilde dağıtılması özellikle önemlidir.",
      "Çatı üzerindeki mevcut ekipmanlar (havalandırma bacaları, ışıklıklar, yangın tahliye sistemleri) yerleşim planı hazırlanırken dikkate alınmalı, panel dizilimi bunlarla çakışmayacak şekilde tasarlanmalıdır.",
      "Sanayi tesislerinde çatı çalışması, iş güvenliği mevzuatı açısından da ayrı bir hassasiyet gerektirir — bu yüzden uygulama, hem elektrik hem yapı güvenliği konusunda deneyimli bir saha ekibi gerektirir.",
    ],
    relatedServiceSlug: "cephe-tipi-uygulamalar",
  },
  {
    slug: "sogutmali-depo-ozel-catida-ges-kurulumu",
    question: "Soğuk hava deposu gibi özel amaçlı çatılarda GES kurulumu farklı mıdır?",
    category: "Ticari ve Endüstriyel Uygulamalar",
    summary:
      "Evet — bu tip yapılarda çatı yalıtımı, buhar bariyeri ve montaj noktalarının delinmesi, standart bir çatıya göre daha fazla dikkat gerektirir.",
    body: [
      "Soğuk hava deposu gibi yalıtımlı ve buhar bariyerli çatılarda, montaj noktalarının çatı bütünlüğünü ve yalıtımı bozmayacak şekilde uygulanması gerekir — yanlış bir delme veya sabitleme, yalıtım kaybına ve nem sorunlarına yol açabilir.",
      "Bu tip yapılarda genellikle çatıyı delmeyen (balastlı) veya delme noktası minimumda tutulan, özel sızdırmazlık detaylarıyla desteklenen montaj sistemleri tercih edilir.",
      "Bu kurulumlar, standart bir çatıya kıyasla daha fazla ön inceleme ve çatı üreticisiyle uyumlu bir montaj detayı gerektirdiğinden, projelendirme aşamasında ayrıca değerlendirilir.",
    ],
    relatedServiceSlug: "cephe-tipi-uygulamalar",
  },

  // ---- Karar ve Genel (devam) ----
  {
    slug: "gunes-enerjisi-sistemi-gayrimenkul-degerini-etkiler-mi",
    question: "Güneş enerjisi sistemi gayrimenkul değerine etki eder mi?",
    category: "Karar ve Genel",
    summary:
      "Doğru kurulmuş ve belgelendirilmiş bir sistem, düşük işletme gideri ve modern altyapı sunduğu için genellikle bir avantaj olarak görülür.",
    body: [
      "İyi projelendirilmiş, resmi başvurusu tamamlanmış ve düzenli bakımı yapılan bir güneş enerjisi sistemi; bir binanın işletme giderlerini öngörülebilir kılan, modern bir altyapı unsuru olarak değerlendirilir.",
      "Bu tür bir sistemin bir gayrimenkulün alım-satım veya kiralama sürecinde nasıl değerlendirileceği; bölgeye, alıcı profiline ve sistemin belgelerinin (proje, garanti, bağlantı onayı) eksiksiz olup olmadığına göre değişir.",
      "Bu nedenle kurulum sırasında hazırlanan proje dosyası ve resmi belgelerin saklanması, yalnızca teknik değil, uzun vadede gayrimenkulün değerini belgelemek açısından da önemlidir.",
    ],
    relatedServiceSlug: "gunes-enerjisi-sistemleri",
  },
  {
    slug: "kocaeli-marmara-bolgesi-gunes-enerjisi-icin-uygun-mu",
    question: "Kocaeli / Marmara Bölgesi güneş enerjisi için uygun mu?",
    category: "Karar ve Genel",
    summary:
      "Marmara Bölgesi, Türkiye'nin en yüksek güneşlenme potansiyeline sahip bölgesi olmasa da, doğru boyutlandırılmış bir sistemle güneş enerjisi burada da verimli şekilde uygulanabilir.",
    body: [
      "Türkiye'nin farklı bölgeleri, farklı düzeylerde güneşlenme potansiyeline sahiptir; Marmara Bölgesi, ülkenin güney ve güneydoğusundaki bölgelere kıyasla daha ölçülü bir güneşlenme profiline sahiptir.",
      "Bu, Kocaeli ve çevresinde güneş enerjisinin verimsiz olduğu anlamına gelmez — daha ölçülü bir güneşlenme profili, sistemin doğru büyüklükte ve doğru açıda projelendirilmesiyle dengelenir. Bölgedeki birçok konut ve sanayi tesisinde çatı ve cephe tipi sistemler zaten aktif olarak kullanılmaktadır.",
      "Bir bölgenin güneş enerjisi için uygunluğu, genel bir bölge ortalamasından çok; o binanın kendi çatı/cephe yönü, gölgeleme durumu ve tüketim profiliyle birlikte, sahada yapılan değerlendirmeyle anlam kazanır.",
    ],
    relatedServiceSlug: "gunes-enerjisi-sistemleri",
  },
];

export function getGuideBySlug(slug: string): GuideItem | undefined {
  return guideItems.find((g) => g.slug === slug);
}
