"use client";
import Image, { type ImageLoaderProps } from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { ManagedProject } from "@/lib/projects/types";
import { formatDate } from "@/lib/crm/types";

const imageSizes = "(max-width: 800px) calc(100vw - 48px), (max-width: 1600px) 48vw, 740px";
function projectImageLoader({ src, width }: ImageLoaderProps) {
  const size = [640, 960, 1440, 2000].find(value => value >= width) ?? 2000;
  return `${src}?w=${size}`;
}

function ProjectSlide({ project, position, total, active, nearby }: { project: ManagedProject; position: number; total: number; active: boolean; nearby: boolean }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const imageIndex = Math.min(selectedImage, Math.max(0, project.images.length - 1));
  return <article className={`live-projects__card${project.images.length ? "" : " live-projects__card--text"}`} aria-label={`${position + 1} / ${total}: ${project.name}`} aria-roledescription="slayt" aria-hidden={!active} inert={!active}>
    {project.images.length > 0 && <div className="live-projects__gallery">
      <div className="live-projects__image-viewport"><div className="live-projects__image-track" style={{ transform: `translate3d(-${imageIndex * 100}%, 0, 0)` }}>
        {project.images.map((image, index) => <div className="live-projects__image" key={image.id} aria-hidden={index !== imageIndex}>
          <Image src={image.url} loader={projectImageLoader} alt={`${project.name} — ${index + 1}. görsel`} fill sizes={imageSizes} loading={nearby && Math.abs(index - imageIndex) <= 1 ? "eager" : "lazy"} fetchPriority={active && index === imageIndex ? "high" : "low"} draggable={false} />
        </div>)}
      </div></div>
      {project.images.length > 1 && <div className="live-projects__image-controls">
        <button type="button" aria-label="Önceki görsel" disabled={imageIndex === 0} onClick={() => setSelectedImage(imageIndex - 1)}>←</button>
        <span aria-live={active ? "polite" : "off"}>{imageIndex + 1} / {project.images.length} görsel</span>
        <button type="button" aria-label="Sonraki görsel" disabled={imageIndex === project.images.length - 1} onClick={() => setSelectedImage(imageIndex + 1)}>→</button>
      </div>}
    </div>}
    <div className="live-projects__details"><span className="live-projects__kicker">ASIR SOLAR / PROJE {String(position + 1).padStart(2, "0")}</span><h3>{project.name}</h3><p className="live-projects__description">{project.description}</p><dl><div><dt>Başlangıç tarihi</dt><dd><time dateTime={project.startDate}>{formatDate(project.startDate)}</time></dd></div><div><dt>Bitiş tarihi</dt><dd>{project.endDate ? <time dateTime={project.endDate}>{formatDate(project.endDate)}</time> : "Henüz belirlenmedi"}</dd></div></dl></div>
  </article>;
}

export function LiveProjects({ initialProjects, unavailable = false }: { initialProjects: ManagedProject[]; unavailable?: boolean }) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedId, setSelectedId] = useState(initialProjects[0]?.id ?? "");
  const [failed, setFailed] = useState(unavailable);
  const [animate, setAnimate] = useState(false);
  const [height, setHeight] = useState<number>();
  const track = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const index = Math.max(0, projects.findIndex(project => project.id === selectedId));
  const project = projects[index];

  // Live record refresh never advances the slider. Only visitor actions animate it.
  useEffect(() => {
    const controller = new AbortController(); let loading = false;
    async function refresh() {
      if (document.hidden || loading) return;
      loading = true;
      try {
        const response = await fetch("/api/projeler", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("unavailable");
        const data = await response.json() as { projects: ManagedProject[] };
        setAnimate(false); setProjects(data.projects);
        setSelectedId(previous => data.projects.some(item => item.id === previous) ? previous : data.projects[0]?.id ?? "");
        setFailed(false);
      } catch { if (!controller.signal.aborted) setFailed(true); }
      finally { loading = false; }
    }
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  useEffect(() => {
    const card = track.current?.children[index];
    if (!card) return;
    const observer = new ResizeObserver(entries => setHeight(entries[0].borderBoxSize?.[0]?.blockSize ?? card.getBoundingClientRect().height));
    observer.observe(card);
    return () => observer.disconnect();
  }, [index, project?.id]);

  function goTo(next: number) {
    if (next < 0 || next >= projects.length || next === index) return;
    setAnimate(true); setSelectedId(projects[next].id);
  }
  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as Element).closest("button, a, input")) return;
    gesture.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    if (!gesture.current) return;
    const dx = event.clientX - gesture.current.x; const dy = event.clientY - gesture.current.y;
    gesture.current = null;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.3) goTo(index + (dx < 0 ? 1 : -1));
  }
  return <section className="live-projects" aria-label="Güncel projeler" aria-roledescription="karusel">
    <div className="live-projects__heading"><div><span className="eyebrow">SAHADAN GÜNCEL PROJELER</span><h2>Fikirden uygulamaya.</h2></div><span className="live-projects__count" aria-live="polite" aria-atomic="true">{projects.length ? `${String(index + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")}` : "00 / 00"}<span className="sr-only">{project ? ` — ${project.name}` : " — Henüz proje yok"}</span></span></div>
    {project ? <>
      <div className="live-projects__stage">
        <button type="button" className="live-projects__arrow live-projects__arrow--previous" aria-label="Önceki proje" aria-controls="project-slider" onClick={() => goTo(index - 1)} disabled={index === 0}>←</button>
        <div id="project-slider" className="live-projects__viewport" role="group" aria-label="Proje slaytları; sağ ve sol ok tuşlarıyla gezebilirsiniz" tabIndex={0} style={{ height }} onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={() => { gesture.current = null; }} onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); goTo(index + (event.key === "ArrowRight" ? 1 : -1)); } }}>
          <div ref={track} className="live-projects__track" data-animate={animate} style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}>
            {projects.map((item, position) => <ProjectSlide key={item.id} project={item} position={position} total={projects.length} active={position === index} nearby={Math.abs(position - index) <= 1} />)}
          </div>
        </div>
        <button type="button" className="live-projects__arrow live-projects__arrow--next" aria-label="Sonraki proje" aria-controls="project-slider" onClick={() => goTo(index + 1)} disabled={index === projects.length - 1}>→</button>
      </div>
      {projects.length > 1 && <div className="live-projects__pagination" aria-label="Proje seçimi">{projects.map((item, position) => <button key={item.id} type="button" aria-label={`${position + 1}. projeye git: ${item.name}`} aria-current={position === index ? "true" : undefined} onClick={() => goTo(position)}><span /></button>)}</div>}
    </> : <div className="live-projects__empty"><span className="live-projects__kicker">PROJE GÜNLÜĞÜ</span><h3>{failed ? "Projeler şu anda yüklenemiyor." : "Yeni projeler burada yerini alacak."}</h3><p>{failed ? "Lütfen biraz sonra tekrar deneyin." : "Sahadaki çalışmalarımızı, proje detaylarını ve uygulama takvimlerini bu alandan takip edebilirsiniz."}</p></div>}
    {failed && projects.length > 0 && <p className="live-projects__notice" role="status">Güncellemeler şu anda alınamıyor. Son yüklenen projeler gösteriliyor.</p>}
  </section>;
}
