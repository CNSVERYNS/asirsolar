import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { services } from "@/data/services";
import { projects } from "@/data/projects";
import { listProjects } from "@/lib/projects/repository";
import { guideItems } from "@/data/guides";
import { guideDetails } from "@/data/guide-details";
import { localAreas, localAreaPath } from "@/data/local-areas";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publishedProjects = await listProjects().catch(() => []);
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
    ...(projects.length > 0 || publishedProjects.length > 0 ? ["/projeler"] : []),
    "/rehber",
    "/ekibimiz",
    "/iletisim",
    "/ges-hesaplama",
    "/ges-kurulumu",
  ].map((path) => ({
    url: `${siteConfig.url}${path}`,
    changeFrequency: "monthly" as const,
    priority: path ? 0.7 : 1,
    ...(["", "/hizmetler", "/kurumsal", "/iletisim", "/ges-hesaplama", "/ges-kurulumu"].includes(path) ? { lastModified: "2026-09-22" } : {}),
  }));

  const serviceRoutes = services.map((s) => ({
    url: `${siteConfig.url}/hizmetler/${s.slug}`,
    lastModified: "2026-09-22", changeFrequency: "monthly" as const, priority: 0.8,
  }));

  const projectRoutes = projects.map((p) => ({
    url: `${siteConfig.url}/projeler/${p.slug}`,
    changeFrequency: "monthly" as const, priority: 0.6,
  }));

  const guideRoutes = guideItems.map((g) => ({
    url: `${siteConfig.url}/rehber/${g.slug}`,
    changeFrequency: "yearly" as const, priority: 0.5,
    ...(guideDetails[g.slug] ? { lastModified: guideDetails[g.slug].updatedAt } : {}),
  }));

  const managedProjectRoutes = publishedProjects.map(project => ({ url: `${siteConfig.url}/projeler/${project.id}`, lastModified: project.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 }));
  const areaRoutes = localAreas.map(area => ({ url: `${siteConfig.url}${localAreaPath(area)}`, lastModified: area.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 }));
  const cityRoutes = [...new Set(localAreas.map(area => area.citySlug))].map(city => ({ url: `${siteConfig.url}/ges-kurulumu/${city}`, lastModified: "2026-09-22", changeFrequency: "monthly" as const, priority: 0.6 }));
  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...managedProjectRoutes, ...guideRoutes, ...areaRoutes, ...cityRoutes];
}
