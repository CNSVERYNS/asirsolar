import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { services } from "@/data/services";
import { projects } from "@/data/projects";
import { guideItems } from "@/data/guides";
import { guideDetails } from "@/data/guide-details";

export default function sitemap(): MetadataRoute.Sitemap {
  // /kvkk, /gizlilik-politikasi ve /cerez-politikasi bilinçli olarak
  // dışarıda: hukuk danışmanı onayına kadar noindex (bkz. o sayfaların
  // metadata'sı) — noindex bir URL'i sitemap'e koymak çelişkilidir.
  //
  // lastModified yalnızca gerçek düzenleme tarihi kayıtlı rehberlerde var.
  // Derleme tarihini içerik değişikliği tarihi olarak kullanmayın.
  const staticRoutes = [
    "",
    "/kurumsal",
    "/hizmetler",
    ...(projects.length > 0 ? ["/projeler"] : []),
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
    ...(guideDetails[g.slug] ? { lastModified: guideDetails[g.slug].updatedAt } : {}),
  }));

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...guideRoutes];
}
