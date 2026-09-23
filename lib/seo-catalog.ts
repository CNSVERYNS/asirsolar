import { services } from "../data/services.ts";
import { guideItems } from "../data/guides.ts";
import { projects } from "../data/projects.ts";
import { localAreas, localAreaPath } from "../data/local-areas.ts";
export type PublicPage = { path: string; title: string; section: string };
export const publicPages: PublicPage[] = [
  { path: "/", title: "Güneşin gücü. Doğru mühendislik.", section: "GÜNEŞ ENERJİSİ SİSTEMLERİ" },
  { path: "/kurumsal", title: "Asır Solar’ı tanıyın", section: "KURUMSAL" },
  { path: "/hizmetler", title: "Güneş enerjisi ve mühendislik hizmetleri", section: "HİZMETLER" },
  { path: "/projeler", title: "Güneş enerjisi projelerimiz", section: "PROJELER" },
  { path: "/rehber", title: "Güneş enerjisi rehberi", section: "BİLGİ VE PLANLAMA" },
  { path: "/ekibimiz", title: "Mühendislik ekibimiz", section: "ASIR SOLAR" },
  { path: "/iletisim", title: "Projenizi birlikte değerlendirelim", section: "ÜCRETSİZ KEŞİF" },
  { path: "/kvkk", title: "Kişisel verilerin korunması", section: "ASIR SOLAR" },
  { path: "/gizlilik", title: "Gizlilik politikası", section: "ASIR SOLAR" },
  { path: "/cerezler", title: "Çerez politikası", section: "ASIR SOLAR" },
  { path: "/hesapla", title: "GES kapasite ve amortisman hesabı", section: "YATIRIM ÖN DEĞERLENDİRMESİ" },
  { path: "/bolgeler", title: "Bölgenize göre GES planlaması", section: "BÖLGE VE OSB REHBERİ" },
  ...Array.from(new Set(localAreas.map(area => area.citySlug))).map(citySlug => ({ path: `/bolgeler/${citySlug}`, title: `${localAreas.find(area => area.citySlug === citySlug)!.city} GES kurulum planlaması`, section: "YEREL MÜHENDİSLİK" })),
  ...localAreas.map(area => ({ path: localAreaPath(area), title: area.title, section: "FABRİKA ÇATI GES" })),
  ...services.map(service => ({ path: `/hizmetler/${service.slug}`, title: service.title, section: "HİZMETLER" })),
  ...guideItems.map(guide => ({ path: `/rehber/${guide.slug}`, title: guide.question, section: "GÜNEŞ ENERJİSİ REHBERİ" })),
  ...projects.map(project => ({ path: `/projeler/${project.slug}`, title: project.name, section: "PROJELER" })),
];
export function findPublicPage(path: string): PublicPage | undefined { return publicPages.find(page => page.path === path); }
export function breadcrumbsFor(path: string, title?: string) {
  const items = [{ name: "Ana Sayfa", path: "/" }];
  const segments = path.split("/").filter(Boolean);
  for (let index = 0; index < segments.length; index++) {
    const currentPath = `/${segments.slice(0, index + 1).join("/")}`;
    const page = findPublicPage(currentPath);
    const name = index === segments.length - 1 && title ? title : page?.title;
    if (name) items.push({ name, path: currentPath });
  }
  return items;
}
