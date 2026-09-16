"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { MAX_IMAGE_BYTES, MAX_PROJECT_IMAGES, type ManagedProject, type ProjectImage, type ProjectInput } from "@/lib/projects/types";
import { formatDate } from "@/lib/crm/types";
import { apiRequest } from "./client";

const blank: ProjectInput = { name: "", description: "", startDate: "", endDate: null, published: true };
function LocalPreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setUrl(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
    return () => { reader.onload = null; if (reader.readyState === FileReader.LOADING) reader.abort(); };
  }, [file]);
  return url ? <Image src={url} alt={file.name} width={200} height={140} unoptimized /> : <span>{file.name}</span>;
}
export function ProjectWorkspace({ initialProjects }: { initialProjects: ManagedProject[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [editing, setEditing] = useState<ManagedProject | null>(null);
  const [opened, setOpened] = useState(false);
  const [input, setInput] = useState<ProjectInput>({ ...blank });
  const [files, setFiles] = useState<File[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");
  const [dirty, setDirty] = useState(false);
  const editor = useRef<HTMLDivElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function open(project: ManagedProject | null) {
    if (dirty && !window.confirm("Kaydedilmemiş değişikliklerden vazgeçilsin mi?")) return;
    setEditing(project); setInput(project ? { name: project.name, description: project.description, startDate: project.startDate, endDate: project.endDate, published: project.published } : { ...blank });
    setFiles([]); setRemoved([]); setOpened(true); setDirty(false); setError(""); setMessage("");
    requestAnimationFrame(() => { editor.current?.scrollIntoView({ block: "start" }); nameInput.current?.focus({ preventScroll: true }); });
  }
  function change<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) { setInput(previous => ({ ...previous, [key]: value })); setDirty(true); }
  function selectFiles(incoming: File[]) {
    setError("");
    if ((editing?.images.length ?? 0) - removed.length + files.length + incoming.length > MAX_PROJECT_IMAGES) { setError("Bir projeye en fazla 12 görsel eklenebilir."); return; }
    if (incoming.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > MAX_IMAGE_BYTES || !file.size)) { setError("Her görsel JPG, PNG veya WebP biçiminde ve en fazla 3 MB olmalı."); return; }
    setFiles(previous => [...previous, ...incoming]); setDirty(true);
  }
  function updateList(project: ManagedProject) { setProjects(previous => [project, ...previous.filter(item => item.id !== project.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt))); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    if (input.endDate && input.endDate < input.startDate) { setError("Bitiş tarihi başlangıç tarihinden önce olamaz."); return; }
    setBusy(true); setError(""); setMessage(""); setProgress("Proje kaydediliyor…");
    let current = editing;
    try {
      // New projects remain private until all selected images have been uploaded.
      if (!current) {
        current = (await apiRequest<{ project: ManagedProject }>("/api/admin/projeler", { method: "POST", body: JSON.stringify({ ...input, published: false }) })).project;
        setEditing(current); updateList(current);
      }
      for (const id of removed) {
        await apiRequest(`/api/admin/projeler/${current.id}/gorseller/${id}`, { method: "DELETE" });
        current = { ...current, images: current.images.filter(image => image.id !== id) };
        setEditing(current); setRemoved(previous => previous.filter(item => item !== id)); updateList(current);
      }
      for (const [index, file] of files.entries()) {
        setProgress(`Görseller yükleniyor… ${index + 1} / ${files.length}`);
        const { image }: { image: ProjectImage } = await apiRequest(`/api/admin/projeler/${current.id}/gorseller`, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        current = { ...current, images: [...current.images, image] };
        setEditing(current); setFiles(previous => previous.filter(item => item !== file)); updateList(current);
      }
      const { project } = await apiRequest<{ project: ManagedProject }>(`/api/admin/projeler/${current.id}`, { method: "PATCH", body: JSON.stringify(input) });
      setEditing(project); updateList(project); setDirty(false);
      setMessage(project.published ? "Proje kaydedildi ve web sitesinde yayınlandı." : "Proje taslak olarak kaydedildi.");
    } catch (reason) { setError((reason instanceof Error ? reason.message : "İşlem tamamlanamadı.") + (current ? " Yüklenen görseller korundu; tekrar kaydedebilirsiniz." : "")); }
    finally { setBusy(false); setProgress(""); }
  }
  async function remove() {
    if (!editing || busy || !window.confirm(`“${editing.name}” projesi ve görselleri kalıcı olarak silinsin mi?`)) return;
    setBusy(true); setError("");
    try { await apiRequest(`/api/admin/projeler/${editing.id}`, { method: "DELETE" }); setProjects(previous => previous.filter(project => project.id !== editing.id)); setOpened(false); setEditing(null); setDirty(false); setMessage("Proje silindi."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Proje silinemedi."); }
    finally { setBusy(false); }
  }
  const visibleImages = editing?.images.filter(image => !removed.includes(image.id)) ?? [];
  return <>
    <div className="crm-page-heading"><div><span className="crm-overline">SAHADAN WEB SİTESİNE</span><h1>Projeler</h1><p className="crm-muted">Proje bilgilerini ve görsellerini ekleyin, güncelleyin ve yayınlayın.</p></div><div className="crm-project-actions"><Link className="crm-button crm-button--quiet" href="/projeler" target="_blank" rel="noreferrer">Sayfayı görüntüle ↗</Link><button className="crm-button" onClick={() => open(null)} disabled={busy}>+ Proje ekle</button></div></div>
    {message && <p className="crm-success" role="status">{message}</p>}{error && <p className="crm-error" role="alert">{error}</p>}
    <div className="crm-project-layout"><section className="crm-panel crm-project-list" aria-label="Kayıtlı projeler"><div className="crm-panel-heading"><h2>Proje arşivi</h2><span className="crm-muted">{projects.length} proje</span></div>{projects.length ? projects.map(project => <button type="button" key={project.id} className="crm-project-row" aria-pressed={opened && editing?.id === project.id} disabled={busy} onClick={() => open(project)}><span className="crm-project-row__title">{project.name}</span><span className={`crm-badge crm-badge--${project.published ? "green" : "amber"}`}>{project.published ? "Yayında" : "Taslak"}</span><span className="crm-muted">{formatDate(project.startDate)} · {project.images.length} görsel</span></button>) : <div className="crm-empty"><span className="crm-empty__icon" aria-hidden="true">▤</span><h2>İlk projenizi ekleyin.</h2><p>Proje ismi, açıklaması, tarihleri ve saha görselleri tek yerde.</p><button className="crm-button" onClick={() => open(null)} disabled={busy}>+ Proje ekle</button></div>}</section>
      {opened ? <div ref={editor} className="crm-panel crm-project-editor"><div className="crm-panel-heading"><h2>{editing ? "Projeyi düzenle" : "Yeni proje"}</h2><span className="crm-muted">{dirty ? "Kaydedilmemiş değişiklikler" : editing ? "Kayıtlı proje" : "Yeni kayıt"}</span></div><form onSubmit={save} className="crm-detail-form"><fieldset className="crm-fields" disabled={busy}>
        <label className="crm-field crm-span">Proje ismi<input ref={nameInput} value={input.name} onChange={event => change("name", event.target.value)} placeholder="Projenin adını yazın" required maxLength={160} /></label>
        <label className="crm-field crm-span">Açıklama<textarea value={input.description} onChange={event => change("description", event.target.value)} placeholder="Projenin kapsamını ve yapılan çalışmaları anlatın." rows={6} required maxLength={5000} /></label>
        <label className="crm-field">Başlangıç tarihi<input type="date" value={input.startDate} onChange={event => change("startDate", event.target.value)} required /></label><label className="crm-field">Bitiş tarihi<input type="date" value={input.endDate ?? ""} min={input.startDate || undefined} onChange={event => change("endDate", event.target.value || null)} /><span className="crm-field-help">Henüz belli değilse boş bırakabilirsiniz.</span></label>
        <div className="crm-span"><label className="crm-field">Proje görselleri<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={event => { selectFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><span className="crm-field-help">JPG, PNG, WebP · Görsel başına en fazla 3 MB · En fazla 12 görsel. İlk görsel kapak olarak gösterilir. Görselsiz de kaydedebilirsiniz.</span></label><div className="crm-project-images">{visibleImages.map((image, index) => <div key={image.id}><Image src={image.url} alt={`${input.name || "Proje"} — ${index + 1}. görsel`} width={200} height={140} unoptimized /><button type="button" onClick={() => { setRemoved(previous => [...previous, image.id]); setDirty(true); }} aria-label={`${index + 1}. görseli kaldır`}>Kaldır ×</button></div>)}{files.map((file, index) => <div key={`${file.name}-${file.lastModified}-${index}`}><LocalPreview file={file} /><button type="button" onClick={() => { setFiles(previous => previous.filter((_, i) => i !== index)); setDirty(true); }} aria-label={`${file.name} seçimini kaldır`}>Kaldır ×</button><small>Kaydedildiğinde yüklenecek</small></div>)}</div></div>
        <label className="crm-project-publish crm-span"><input type="checkbox" checked={input.published} onChange={event => change("published", event.target.checked)} /><span>Web sitesinde yayınla<small>Kapalıyken yalnızca panelde taslak olarak görünür.</small></span></label>
      </fieldset><div className="crm-form-actions">{editing && <button type="button" className="crm-archive-button" disabled={busy} onClick={remove}>Projeyi sil</button>}<button className="crm-button" disabled={busy}>{busy ? progress : "Projeyi kaydet"}</button></div><p className="crm-field-help crm-project-save-note" role="status">{busy ? "Lütfen yükleme tamamlanana kadar bu sayfada kalın." : "Yayınlanan değişiklikler projeler sayfasına otomatik yansır."}</p></form></div> : <div className="crm-panel crm-project-intro"><span className="crm-overline">PROJE YÖNETİMİ</span><h2>Çalışmalarınızı paylaşın.</h2><p>Yeni bir proje ekleyin veya arşivden bir proje seçerek düzenlemeye başlayın.</p><p>Yayınladığınız projeler, ziyaretçilerin oklarla gezebildiği güncel projeler alanında görünür.</p></div>}
    </div>
  </>;
}
