// Şirket kimliği ve adresi kaşe / tabela görsellerinden doğrulanmıştır.
// Tatlıkuyu / Gebze posta kodu: 41400.
// Kaynak: https://www.postakodu.com.tr/kocaeli/gebze/tatlikuyu-mah/
// Doğrulanamayan alanlar (kuruluş yılı, kurulu güç, proje sayısı vb.) bilinçli olarak
// eklenmemiştir. Yeni bilgi geldiğinde yalnızca bu dosya güncellenmelidir.

export const company = {
  legalName:
    "Asır Solar Enerji Sistemleri Taahhüt Danışmanlık Sanayi Ticaret Ltd. Şti.",
  brandName: "Asır Solar",
  secondaryBrand: "Asır Mekanik Solar",

  phoneDisplay: "0262 644 69 89",
  phoneHref: "tel:+902626446989",
  workingHours: "Pazartesi–Cuma 08.00–17.00",
  pricing: {
    range: "Projeye ve konuma göre değişir.",
    description: "Fiyatlar projeye ve konuma göre değişir. Projeniz için kesin fiyat almak üzere ücretsiz keşif planlayabilirsiniz.",
  },

  address: {
    line1: "Tatlıkuyu Mah. 1308/4. Sok. No:27/A",
    line2: "Gebze / Kocaeli",
    postalCode: "41400",
    full: "Tatlıkuyu Mah. 1308/4. Sok. No:27/A, 41400 Gebze / Kocaeli",
    mapsHref:
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(
        "Tatlıkuyu Mah. 1308/4. Sok. No:27/A, Gebze / Kocaeli"
      ),
  },

  taxOffice: {
    name: "Ulucınar Vergi Dairesi",
    number: "0861748825",
  },

  emails: [
    { name: "Onur Durak", email: "onur.durak@asirsolar.com" },
    { name: "Furkan Cansever", email: "furkan.cansever@asirsolar.com" },
  ],

  // Onur ve Furkan'ın eriştiği doğrulanmış ortak posta kutusu.
  generalEmail: "iletisim@asirsolar.com",
} as const;
