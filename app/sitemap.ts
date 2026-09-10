import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { services } from "@/data/services";
import { projects } from "@/data/projects";
import { guideItems } from "@/data/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  // /kvkk, /gizlilik-politikasi ve /cerez-politikasi bilinçli olarak
  // dışarıda: hukuk danışmanı onayına kadar noindex (bkz. o sayfaların
  // metadata'sı) — noindex bir URL'i sitemap'e koymak çelişkilidir.
  //
  // lastModified kasıtlı olarak verilmiyor: her build'de new Date()
  // damgalamak, içerik gerçekte değişmese bile "az önce güncellendi"
  // sinyali gönderir — bu, gerçek değişiklik tarihini bilmediğimiz
  // içerik için yanıltıcı olur.
  const staticRoutes = [
    "",
    "/kurumsal",
    "/hizmetler",
    "/projeler",
    "/rehber",
    "/ekibimiz",
    "/iletisim",
  ].map((path) => ({
    url: `${siteConfig.url}${path}`,
  }));

  const serviceRoutes = services.map((s) => ({
    url: `${siteConfig.url}/hizmetler/${s.slug}`,
  }));

  const projectRoutes = projects.map((p) => ({
    url: `${siteConfig.url}/projeler/${p.slug}`,
  }));

  const guideRoutes = guideItems.map((g) => ({
    url: `${siteConfig.url}/rehber/${g.slug}`,
  }));

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...guideRoutes];
}
