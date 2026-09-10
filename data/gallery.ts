// Sahadan görseller — atmosfer / kapasite göstergesi olarak kullanılır.
// Belirli bir projeye ait olduğu iddia edilmez; yalnızca sistem tipini
// tanımlayan genel bir etiket taşır. Kaynak: Unsplash (ücretsiz lisans,
// atıf zorunlu değil). Fotoğrafçı bilgisi yorum olarak eklenmiştir.

export type GalleryImage = {
  src: string;
  alt: string;
  label: string;
};

export const galleryImages: GalleryImage[] = [
  {
    src: "/images/stock/hero-farm.jpg",
    alt: "Havadan görünüm — geniş ölçekli güneş enerjisi santrali",
    label: "Arazi Tipi GES",
  },
  {
    src: "/images/stock/worker-install.jpg",
    alt: "Panel yüzeyinde montaj detayı",
    label: "Panel Montajı",
  },
  {
    src: "/images/stock/panel-building.jpg",
    alt: "Çatıya monte edilmiş güneş panelleri",
    label: "Çatı Tipi Kurulum",
  },
  {
    src: "/images/stock/industrial-roof.jpg",
    alt: "Endüstriyel bina çatısında panel dizilimi",
    label: "Endüstriyel Çatı",
  },
  {
    src: "/images/stock/field-array.jpg",
    alt: "Zeminde kurulu panel sırası",
    label: "Zemin Montaj Sistemi",
  },
  {
    src: "/images/stock/rows-field.jpg",
    alt: "Havadan panel dizilimi dokusu",
    label: "Panel Dizilimi",
  },
  {
    src: "/images/stock/sunset-silhouette.jpg",
    alt: "Gün batımında panel silüeti",
    label: "Saha Görünümü",
  },
];
