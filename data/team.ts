// Ekip bilgileri. Yalnızca doğrulanmış isim, unvan ve e-posta içerir.
// Fotoğraf, unvan detayı (ör. "Elektrik Mühendisi") gibi doğrulanmamış
// bilgiler eklenmemiştir — yeni bilgi geldiğinde tamamlanabilir.

export type TeamMember = {
  name: string;
  role: string;
  email: string;
};

export const team: TeamMember[] = [
  {
    name: "Onur Durak",
    role: "Mühendis",
    email: "onur.durak@asirsolar.com",
  },
  {
    name: "Furkan Cansever",
    role: "Mühendis",
    email: "furkan.cansever@asirsolar.com",
  },
];
