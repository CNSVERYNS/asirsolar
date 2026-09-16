"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { ManagedProject } from "@/lib/projects/types";
import { formatDate } from "@/lib/crm/types";

export function LiveProjects({ initialProjects, unavailable = false }: { initialProjects: ManagedProject[]; unavailable?: boolean }) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedId, setSelectedId] = useState(initialProjects[0]?.id ?? "");
  const [imageIndex, setImageIndex] = useState(0);
  const [failed, setFailed] = useState(unavailable);
  // Refresh records without advancing either carousel.
  useEffect(() => {
    const controller = new AbortController(); let loading = false;
    async function refresh() {
      if (document.hidden || loading) return;
      loading = true;
      try {
        const response = await fetch("/api/projeler", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("unavailable");
        const data = await response.json() as { projects: ManagedProject[] };
        setProjects(data.projects);
        setSelectedId(previous => data.projects.some(project => project.id === previous) ? previous : data.projects[0]?.id ?? "");
        setFailed(false);
      } catch { if (!controller.signal.aborted) setFailed(true); }
      finally { loading = false; }
    }
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  const index = Math.max(0, projects.findIndex(project => project.id === selectedId));
  const project = projects[index];
  const currentImageIndex = project ? Math.min(imageIndex, Math.max(0, project.images.length - 1)) : 0;
  function move(direction: number) {
    if (!projects.length) return;
    setSelectedId(projects[(index + direction + projects.length) % projects.length].id); setImageIndex(0);
  }
  return <section className="live-projects" aria-label="Güncel projeler" aria-roledescription="karusel">
    <div className="live-projects__heading"><div><span className="eyebrow">SAHADAN GÜNCEL PROJELER</span><h2>Fikirden uygulamaya.</h2></div><div className="live-projects__controls"><span aria-live="polite">{projects.length ? `${String(index + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")}` : "00 / 00"}</span><button type="button" aria-label="Önceki proje" onClick={() => move(-1)} disabled={projects.length < 2}>←</button><button type="button" aria-label="Sonraki proje" onClick={() => move(1)} disabled={projects.length < 2}>→</button></div></div>
    {project ? <article className={`live-projects__card${project.images.length ? "" : " live-projects__card--text"}`} aria-label={`${index + 1} / ${projects.length}: ${project.name}`}>
      {project.images.length > 0 && <div className="live-projects__gallery"><div className="live-projects__image"><Image src={project.images[currentImageIndex].url} alt={`${project.name} — ${currentImageIndex + 1}. görsel`} fill unoptimized sizes="(max-width: 800px) 100vw, 55vw" /></div>{project.images.length > 1 && <div className="live-projects__image-controls"><button type="button" aria-label="Önceki görsel" onClick={() => setImageIndex((currentImageIndex - 1 + project.images.length) % project.images.length)}>←</button><span aria-live="polite">{currentImageIndex + 1} / {project.images.length} görsel</span><button type="button" aria-label="Sonraki görsel" onClick={() => setImageIndex((currentImageIndex + 1) % project.images.length)}>→</button></div>}</div>}
      <div className="live-projects__details"><span className="live-projects__kicker">ASIR SOLAR / PROJE {String(index + 1).padStart(2, "0")}</span><h3>{project.name}</h3><p className="live-projects__description">{project.description}</p><dl><div><dt>Başlangıç tarihi</dt><dd><time dateTime={project.startDate}>{formatDate(project.startDate)}</time></dd></div><div><dt>Bitiş tarihi</dt><dd>{project.endDate ? <time dateTime={project.endDate}>{formatDate(project.endDate)}</time> : "Henüz belirlenmedi"}</dd></div></dl></div>
    </article> : <div className="live-projects__empty"><span className="live-projects__kicker">PROJE GÜNLÜĞÜ</span><h3>{failed ? "Projeler şu anda yüklenemiyor." : "Yeni projeler burada yerini alacak."}</h3><p>{failed ? "Lütfen biraz sonra tekrar deneyin." : "Sahadaki çalışmalarımızı, proje detaylarını ve uygulama takvimlerini bu alandan takip edebilirsiniz."}</p></div>}
    {failed && projects.length > 0 && <p className="live-projects__notice" role="status">Güncellemeler şu anda alınamıyor. Son yüklenen projeler gösteriliyor.</p>}
  </section>;
}
