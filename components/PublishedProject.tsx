import Image from "next/image";
import Link from "next/link";
import type { ManagedProject } from "@/lib/projects/types";
import { siteConfig } from "@/lib/site";
import { organizationId } from "@/lib/structured-data";
import { Container } from "./Container";
import { Breadcrumbs } from "./Breadcrumbs";
import { JsonLd } from "./JsonLd";
export function PublishedProject({ project }: { project: ManagedProject }) {
  const path = `/projeler/${project.slug}`;
  const date = (value: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(value));
  return <><JsonLd data={{ "@context": "https://schema.org", "@type": "CreativeWork", name: project.name, description: project.description, url: `${siteConfig.url}${path}`, dateModified: project.updatedAt, creator: { "@id": organizationId }, image: project.images.map(image => `${siteConfig.url}${image.url}`) }} /><section className="page-hero"><Container><Breadcrumbs path={path} title={project.name} /><p className="eyebrow">ASIR SOLAR / PROJE</p><h1>{project.name}</h1></Container></section><section className="section section--tight"><Container><div className="two-col"><article className="prose two-col__main"><h2>Proje hakkında</h2><p className="tw:whitespace-pre-line">{project.description}</p></article><aside className="two-col__side"><h2>Proje takvimi</h2><dl className="tw:grid tw:gap-3"><div><dt>Başlangıç</dt><dd><time dateTime={project.startDate}>{date(project.startDate)}</time></dd></div><div><dt>Bitiş</dt><dd>{project.endDate ? <time dateTime={project.endDate}>{date(project.endDate)}</time> : "Henüz belirlenmedi"}</dd></div></dl></aside></div>{project.images.length > 0 && <section className="tw:mt-8"><h2>Proje görselleri</h2><div className="public-project-gallery">{project.images.map((image, index) => <div className="public-project-image" key={image.id}><Image src={`${image.url}?w=1280`} unoptimized alt={`${project.name} — uygulama görseli ${index + 1}`} fill sizes="(max-width: 680px) 100vw, 50vw" /></div>)}</div></section>}<Link className="btn btn--primary" href="/iletisim">Benzer projenizi görüşelim <span aria-hidden="true">↗</span></Link></Container></section></>;
}
