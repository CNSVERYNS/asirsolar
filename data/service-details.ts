export type ContentSection = { title: string; paragraphs: string[]; items?: string[] };
type ServiceDetail = { sections: ContentSection[]; preparation: string[] };

export const serviceDetails: Record<string, ServiceDetail> = {
  "gunes-enerjisi-sistemleri": {
    sections: [
      { title: "Tüketiminize göre sistem planlaması", paragraphs: ["Sistem gücünü yalnızca boş çatı alanına göre seçmek yeterli değildir. Son 12 aylık tüketim, gündüz çalışma saatleri ve ileride eklenecek elektrikli yükler birlikte ele alınır. Konutun akşam ağırlıklı tüketimi ile bir işletmenin gündüz üretimi farklı çözümler gerektirebilir.", "Gebze ve Kocaeli’deki bir saha için üretim tahmini hazırlanırken konum, panel yönü ve eğimi, yakın çevredeki gölgeler ve sistem kayıpları değerlendirilir. Tahmini üretim ile aynı saatlerde kullanılabilecek enerji ayrı gösterilir."] },
      { title: "Teklifte hangi bilgiler yer almalı?", paragraphs: ["Karşılaştırılabilir bir teklif, ekipman listesi ve kurulum bedelinin yanında hesap varsayımlarını da açıklar. Başvuru, altyapı revizyonu ve çatıya ilişkin ek işler kapsamda ayrıca belirtilmelidir."], items: ["Panelin toplam DC gücü ve inverterin AC gücü", "Yerleşim planı, montaj yöntemi ve kablo güzergâhı", "Üretim tahmininin girdileri ve kayıp kabulleri", "Garanti kapsamı, bakım koşulları ve teslim belgeleri"] },
    ],
    preparation: ["Son 12 aya ait tüketim bilgileri", "Saha adresi ve varsa çatı planı", "Gündüz kullanım saatleri ve büyüme planı"],
  },
  "cephe-tipi-uygulamalar": {
    sections: [
      { title: "Çatı kaplaması montaj kararını değiştirir", paragraphs: ["Kiremit, trapez sac ve membran çatıda bağlantı detayı aynı değildir. Taşıyıcı elemanların yeri, kaplamanın durumu, su yalıtımı ve bakım erişimi incelenmeden montaj yöntemi kesinleştirilmez. Yenilenmesi gereken bir çatı için panel kurulumundan önce yapılacak işler belirlenir.", "Panel ve konstrüksiyon ağırlığına ek olarak rüzgâr ve kar etkileri değerlendirilir. Statik uygunluk, yalnızca fotoğraf üzerinden verilebilecek bir karar değildir; mevcut yapı belgeleri ve yerinde inceleme birlikte kullanılır."] },
      { title: "Cephe uygulamasında üretim ve mimari uyum", paragraphs: ["Cephede panel yönü, komşu binalar ve balkon çıkmaları üretimi etkiler. Taşıyıcı bağlantılar, yangın ve bakım erişimi, kablo güzergâhı ve bina görünümü proje içinde birlikte çözülür. Çatı için hesaplanan üretim, aynı güçte bir cephe sistemi için doğrudan kullanılamaz."], items: ["Kullanılabilir yüzey ve gölge incelemesi", "Taşıyıcı bağlantılar ve yalıtım detayları", "Bakım yolları ve güvenli erişim", "Çatı ve cephe seçeneklerinin saha koşullarıyla karşılaştırılması"] },
    ],
    preparation: ["Varsa mimari ve statik proje", "Mevcut çatı/cephe fotoğrafları", "Yalıtım, onarım ve tadilat geçmişi"],
  },
  "projelendirme-ve-muhendislik": {
    sections: [
      { title: "Keşiften uygulama dosyasına", paragraphs: ["Keşifte kullanılabilir alan, gölgeler, elektrik panosu, bağlantı noktası ve saha erişimi değerlendirilir. Bulgular; yerleşim, elektrik bağlantıları, ekipman seçimi ve uygulama kapsamına aktarılır. Mevcut belgelerde eksik bilgi varsa tasarım kesinleşmeden önce bu eksikler netleştirilir.", "Gebze ve Kocaeli’de şebekeye bağlı bir proje hazırlanırken ilgili şebeke işletmecisi ve başvuru yolu sahaya göre belirlenir. Organize sanayi bölgesindeki bir tesisin bağlantı süreci ayrıca kontrol edilir. Kurum değerlendirmesine bağlı süreler, ekipman tedarik ve montaj takviminden ayrı planlanır."] },
      { title: "Proje dosyasını birlikte değerlendirin", paragraphs: ["Tek hat şeması ile yerleşim planı birbiriyle uyumlu olmalı; ekipman özellikleri, bağlantı noktası ve koruma yaklaşımı açıklanmalıdır. Nihai teslim kapsamı teklif aşamasında yazılı olarak belirlenir."], items: ["Keşif bulguları ve tasarım varsayımları", "Panel yerleşimi ve tek hat şeması", "Ekipman teknik özellikleri ve kapsam listesi", "Başvuru, uygulama ve teslim aşamalarının planı"] },
    ],
    preparation: ["Elektrik aboneliği ve tüketim bilgileri", "Varsa mevcut elektrik ve yapı projeleri", "Mülkiyet/kullanım durumu ve işletme ihtiyaçları"],
  },
  "elektrik-altyapisi": {
    sections: [
      { title: "Mevcut tesisle uyumlu bağlantı", paragraphs: ["Güneş enerjisi sistemi mevcut elektrik tesisine bağlandığı için pano kapasitesi, kablo güzergâhları ve bağlantı noktası birlikte incelenir. Sadece inverter gücüne bakarak pano veya kablo seçilmez; mesafe, kurulum koşulları ve koruma koordinasyonu da tasarıma girer.", "DC ve AC tarafındaki ayırma, aşırı akım ve aşırı gerilim korumaları ekipman özelliklerine göre seçilir. Topraklama düzeni ve mevcut koruma elemanları gözden geçirilir. Revizyon ihtiyacı keşif ve teknik hesaplardan sonra kapsamlandırılır."] },
      { title: "İşletmenin çalışma düzenini koruyan planlama", paragraphs: ["Pano revizyonunda kesinti gerektiren işler işletmeyle önceden planlanır. Sayaç ve şebeke bağlantısıyla ilgili işlemler, yetkili kurumların süreçleriyle koordine edilir. Devreye alma sırasında ölçüm sonuçları ve yapılan düzenlemeler teslim belgelerine aktarılır."], items: ["Pano, kablo ve bağlantı noktası incelemesi", "Koruma elemanlarının koordinasyonu", "Etiketleme ve güncel elektrik çizimleri", "Planlı kesinti ve devreye alma hazırlığı"] },
    ],
    preparation: ["Varsa tek hat şeması ve pano bilgileri", "Sözleşme gücü ve bağlantı bilgileri", "Kesinti yapılabilecek zaman aralıkları"],
  },
  "kurulum-ve-devreye-alma": {
    sections: [
      { title: "Sahada planlı uygulama", paragraphs: ["Kurulum öncesinde saha erişimi, malzeme indirme alanı, çalışma güvenliği ve uygulama sırası planlanır. Mekanik montaj, onaylı yerleşim ve bağlantı detaylarıyla ilerler. Sahada projeyi etkileyen bir farklılık görüldüğünde çözüm teknik değerlendirmeyle netleştirilir.", "Panel, inverter ve pano bağlantılarında ekipman üreticilerinin talimatları dikkate alınır. Kablo güzergâhı, mekanik koruma ve etiketleme teslim öncesinde kontrol edilir. Şebekeye paralel işletmeye geçiş ilgili onay ve kabul süreçlerine bağlıdır."] },
      { title: "Teslim yalnızca sistemi açmak değildir", paragraphs: ["Devreye alma, montaj kontrolünü, gerekli elektriksel ölçümleri ve sistemin çalışmasının doğrulanmasını kapsar. Kullanıcıya izleme ekranı, arıza bildirim yolu ve bakım sorumlulukları anlatılır."], items: ["Mekanik bağlantı ve saha düzeni kontrolü", "Elektriksel test ve ölçüm kayıtları", "Ekipman ve garanti belgeleri", "Kullanım, izleme ve bakım bilgilendirmesi"] },
    ],
    preparation: ["Saha erişimi ve çalışma saatleri", "Montaj süresince görevli irtibat kişisi", "Planlı kesinti ve teslim beklentileri"],
  },
  "bakim-ve-teknik-destek": {
    sections: [
      { title: "Üretim düşüşünün nedenini birlikte inceleyin", paragraphs: ["Düşük üretim tek başına panel arızası anlamına gelmez. Hava koşulları, yeni gölgeler, kirlenme, kesintiler ve inverter uyarıları birlikte incelenir. Aynı dönemin izleme kayıtları ve varsa önceki yılların verileri karşılaştırmayı anlamlı hâle getirir.", "Temizlik ve kontrol sıklığı çevre koşullarına, erişime ve ekipman talimatlarına göre belirlenir. Üretim devam ederken elektrik bağlantılarına müdahale edilmez; sahadaki teknik işler yetkin ekip tarafından planlanır."] },
      { title: "Destek talebini hızlandıran bilgiler", paragraphs: ["Arıza bildiriminde inverter modeli, uyarı kodu ve sorunun başladığı zaman paylaşılabilir. Uzaktan inceleme sonucu sahaya ihtiyaç duyulursa ziyaret kapsamı belirlenir. Parça değişimi ve garanti kapsamı, ekipman belgeleri ve inceleme bulgularıyla değerlendirilir."], items: ["Üretim kayıtları ve inverter uyarıları", "Panel, konstrüksiyon ve bağlantıların kontrolü", "Bakım bulguları ve önerilen işlemler", "Garanti ve parça ihtiyaçlarının değerlendirilmesi"] },
    ],
    preparation: ["Sistem gücü ve ekipman modelleri", "İzleme kayıtları veya uyarı ekranı görüntüsü", "Kurulum tarihi ve önceki bakım bilgileri"],
  },
};
