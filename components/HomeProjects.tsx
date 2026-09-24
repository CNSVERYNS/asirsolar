import Image from "next/image";
import Link from "next/link";
import { Container } from "./Container";
import { listProjects } from "@/lib/projects/repository";
import type { ManagedProject } from "@/lib/projects/types";

export async function HomeProjects() {
  let projects: ManagedProject[] = [];
  try { projects = (await listProjects()).slice(0, 4); } catch { /* Public contact and service content remain available. */ }
  return <section className="section home-projects"><Container>
    <div className="editorial-heading"><div><p className="eyebrow">SAHADAN GÜNCEL PROJELER</p><h2>Projeden uygulamaya.</h2></div><Link href="/projeler" className="text-link">Tüm projeler ↗</Link></div>
    {projects.length ? <div className="home-project-grid">{projects.map(project => <article className="home-project-card" key={project.id}><Link href={`/projeler/${project.slug}`}>
      {project.images[0] && <div className="home-project-image"><Image src={`${project.images[0].url}?w=960`} alt={`${project.name} — proje saha görseli`} fill unoptimized sizes="(max-width: 680px) 100vw, 50vw" /></div>}
      <h3>{project.name}</h3><p>{project.description}</p><span className="text-link">Projeyi inceleyin ↗</span>
    </Link></article>)}</div> : <p>Güncel saha çalışmalarını ve proje takvimlerini <Link href="/projeler" className="text-link">projeler sayfamızdan</Link> takip edebilirsiniz.</p>}
  </Container></section>;
}
