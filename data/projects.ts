// Doğrulanmış, yayınlanmaya hazır proje verisi henüz eklenmedi.
// Sahte proje / lokasyon / kapasite bilgisi ile doldurulmamalıdır.
// Gerçek bir proje eklenmek istendiğinde bu diziye bir kayıt eklemek yeterlidir;
// /projeler ve /projeler/[slug] sayfaları bu veriye göre otomatik oluşur.

export type Project = {
  slug: string;
  name: string;
  location: string;
  systemType: string;
  capacity: string;
  date: string;
  scope: string[];
  image: string;
  summary: string;
};

export const projects: Project[] = [];
