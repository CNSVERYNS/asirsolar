export const siteConfig = {
  url: new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://asirsolar.vercel.app").origin,
  name: "Asır Solar",
  titleTemplate: "%s | Asır Solar",
  defaultTitle: "Asır Solar | Güneş Enerjisi Sistemleri Kurulumu — Gebze, Kocaeli",
  defaultDescription:
    "Gebze / Kocaeli merkezli Asır Solar; çatı ve cephe tipi güneş enerjisi sistemlerini keşiften devreye almaya kadar kendi mühendislik ve saha ekibiyle kurar. Ücretsiz keşif.",
};

// Next.js metadata merges only one level deep: a page that declares its
// own `openGraph` object REPLACES the root layout's entirely (not just the
// title/description inside it) — so without re-declaring type/siteName/
// image here, every inner page would share-preview with no OG image at
// all. This helper keeps title/description/OG/canonical in sync from one
// call per page. See node_modules/next/dist/docs/.../generate-metadata.md
// ("Merging" section) — this is Next 16 behavior, not the old default.
export const defaultOgImage = { url: "/images/stock/hero-farm.jpg", width: 2400, height: 1350, alt: "Güneş paneli sahası — temsili görsel, Asır Solar" };

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  const url = `${siteConfig.url}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website" as const,
      locale: "tr_TR",
      siteName: siteConfig.name,
      title,
      description,
      url,
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [defaultOgImage.url],
    },
  };
}

export const navLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/kurumsal", label: "Kurumsal" },
  { href: "/hizmetler", label: "Hizmetler" },
  { href: "/projeler", label: "Projeler" },
  { href: "/rehber", label: "Rehber" },
  { href: "/ekibimiz", label: "Ekibimiz" },
  { href: "/iletisim", label: "İletişim" },
] as const;
