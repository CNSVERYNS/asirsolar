// Şirket bilgileri — tamamı kaşe / tabela görsellerinden doğrulanmıştır.
// Doğrulanamayan alanlar (kuruluş yılı, kurulu güç, proje sayısı vb.) bilinçli olarak
// eklenmemiştir. Yeni bilgi geldiğinde yalnızca bu dosya güncellenmelidir.

export const company = {
  legalName:
    "Asır Solar Enerji Sistemleri Taahhüt Danışmanlık Sanayi Ticaret Ltd. Şti.",
  brandName: "Asır Solar",
  secondaryBrand: "Asır Mekanik Solar",

  phoneDisplay: "0262 644 69 89",
  phoneHref: "tel:+902626446989",

  address: {
    line1: "Tatlıkuyu Mah. 1308/4. Sok. No:27/A",
    line2: "Gebze / Kocaeli",
    full: "Tatlıkuyu Mah. 1308/4. Sok. No:27/A, Gebze / Kocaeli",
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

  // Genel iletişim için ilk mühendis adresi kullanılır.
  generalEmail: "onur.durak@asirsolar.com",
} as const;
