// Coğrafi bölgeye göre örnek güneşlenme/verim katsayısı (illustrative — gerçek ölçüm verisi değildir)
export const regionSunFactor = {
  'Marmara': 1.00, 'Ege': 1.06, 'Akdeniz': 1.14, 'İç Anadolu': 1.08,
  'Karadeniz': 0.88, 'Doğu Anadolu': 1.05, 'Güneydoğu Anadolu': 1.16
};

export const cityRegion = {
  'İstanbul': 'Marmara', 'Edirne': 'Marmara', 'Kırklareli': 'Marmara', 'Tekirdağ': 'Marmara', 'Kocaeli': 'Marmara', 'Sakarya': 'Marmara', 'Yalova': 'Marmara', 'Bursa': 'Marmara', 'Balıkesir': 'Marmara', 'Çanakkale': 'Marmara', 'Bilecik': 'Marmara',
  'İzmir': 'Ege', 'Manisa': 'Ege', 'Aydın': 'Ege', 'Denizli': 'Ege', 'Muğla': 'Ege', 'Uşak': 'Ege', 'Kütahya': 'Ege', 'Afyonkarahisar': 'Ege',
  'Antalya': 'Akdeniz', 'Mersin': 'Akdeniz', 'Adana': 'Akdeniz', 'Hatay': 'Akdeniz', 'Kahramanmaraş': 'Akdeniz', 'Osmaniye': 'Akdeniz', 'Isparta': 'Akdeniz', 'Burdur': 'Akdeniz',
  'Ankara': 'İç Anadolu', 'Konya': 'İç Anadolu', 'Kayseri': 'İç Anadolu', 'Sivas': 'İç Anadolu', 'Yozgat': 'İç Anadolu', 'Kırşehir': 'İç Anadolu', 'Nevşehir': 'İç Anadolu', 'Niğde': 'İç Anadolu', 'Aksaray': 'İç Anadolu', 'Karaman': 'İç Anadolu', 'Çankırı': 'İç Anadolu', 'Kırıkkale': 'İç Anadolu', 'Eskişehir': 'İç Anadolu',
  'Zonguldak': 'Karadeniz', 'Bartın': 'Karadeniz', 'Karabük': 'Karadeniz', 'Kastamonu': 'Karadeniz', 'Çorum': 'Karadeniz', 'Amasya': 'Karadeniz', 'Samsun': 'Karadeniz', 'Tokat': 'Karadeniz', 'Ordu': 'Karadeniz', 'Giresun': 'Karadeniz', 'Trabzon': 'Karadeniz', 'Rize': 'Karadeniz', 'Artvin': 'Karadeniz', 'Gümüşhane': 'Karadeniz', 'Bayburt': 'Karadeniz', 'Sinop': 'Karadeniz', 'Düzce': 'Karadeniz', 'Bolu': 'Karadeniz',
  'Erzurum': 'Doğu Anadolu', 'Erzincan': 'Doğu Anadolu', 'Bingöl': 'Doğu Anadolu', 'Tunceli': 'Doğu Anadolu', 'Elazığ': 'Doğu Anadolu', 'Malatya': 'Doğu Anadolu', 'Bitlis': 'Doğu Anadolu', 'Muş': 'Doğu Anadolu', 'Van': 'Doğu Anadolu', 'Ağrı': 'Doğu Anadolu', 'Kars': 'Doğu Anadolu', 'Iğdır': 'Doğu Anadolu', 'Ardahan': 'Doğu Anadolu', 'Hakkari': 'Doğu Anadolu',
  'Gaziantep': 'Güneydoğu Anadolu', 'Şanlıurfa': 'Güneydoğu Anadolu', 'Diyarbakır': 'Güneydoğu Anadolu', 'Mardin': 'Güneydoğu Anadolu', 'Siirt': 'Güneydoğu Anadolu', 'Şırnak': 'Güneydoğu Anadolu', 'Batman': 'Güneydoğu Anadolu', 'Adıyaman': 'Güneydoğu Anadolu', 'Kilis': 'Güneydoğu Anadolu'
};

/** Tüm illeri sıralı biçimde döndürür (ROI hesaplayıcı <select> için). */
export function allCities() {
  return Object.keys(cityRegion);
}
