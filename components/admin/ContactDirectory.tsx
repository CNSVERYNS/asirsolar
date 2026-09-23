"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { emptyContact, type Contact, type ContactDetail, type ContactInput, type ContactList } from "@/lib/crm/contacts";
import { apiRequest, ApiError } from "./client";

function ContactEditor({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: (duplicate: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const saving = useRef(false);
  const requestKey = useRef("");
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [draft, setDraft] = useState<ContactInput>(emptyContact);
  const [loading, setLoading] = useState(!!id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    const node = dialog.current, active = document.activeElement;
    node?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestKey.current = crypto.randomUUID();
    return () => { node?.close(); document.body.style.overflow = overflow; if (active instanceof HTMLElement) active.focus(); };
  }, []);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    apiRequest<ContactDetail>(`/api/admin/crm/${id}`, { signal: controller.signal }).then(result => {
      if (!controller.signal.aborted) { setDetail(result); setDraft(result.contact); }
    }).catch(error => {
      if (!controller.signal.aborted) {
        if (error instanceof ApiError && error.status === 401) router.replace("/admin/giris");
        else setError(error instanceof Error ? error.message : "Kişi yüklenemedi.");
      }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, router]);
  function update(field: keyof ContactInput, value: string) {
    // A changed payload is a new operation; network retries keep the same key.
    requestKey.current = crypto.randomUUID();
    setDraft(current => ({ ...current, [field]: value }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving.current || loading || (id && !detail)) return;
    saving.current = true; setBusy(true); setError("");
    try {
      const result = await apiRequest<{ contact: Contact; duplicate?: boolean }>(id ? `/api/admin/crm/${id}` : "/api/admin/crm", {
        method: id ? "PATCH" : "POST", headers: { "Idempotency-Key": requestKey.current },
        body: JSON.stringify({ name: draft.name, company: draft.company, phone: draft.phone, email: draft.email, address: draft.address, ...(detail ? { version: detail.contact.version } : {}) }),
      });
      onSaved(result.duplicate === true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) router.replace("/admin/giris");
      else setError(error instanceof Error ? error.message : "Kişi kaydedilemedi.");
    } finally { saving.current = false; setBusy(false); }
  }
  return <dialog ref={dialog} className="crm-modal contacts-dialog" aria-labelledby="contact-title" onCancel={event => { event.preventDefault(); if (!saving.current) onClose(); }}>
    <div className="crm-modal__heading"><div><span className="crm-overline">KİŞİ REHBERİ</span><h2 id="contact-title">{id ? "Kişi bilgileri" : "Yeni kişi ekle"}</h2></div><button type="button" className="crm-icon-button" aria-label="Pencereyi kapat" disabled={busy} onClick={onClose}>✕</button></div>
    {loading ? <p role="status" className="crm-muted">Kişi bilgileri yükleniyor…</p> : <form onSubmit={submit}>
      <fieldset className="contacts-fields" disabled={busy || (!!id && !detail)}>
        <label className="contacts-field contacts-field--wide">Ad soyad <span aria-hidden="true">*</span><input name="name" autoComplete="name" value={draft.name} onChange={event => update("name", event.target.value)} required minLength={2} maxLength={100} /></label>
        <label className="contacts-field contacts-field--wide">Şirket adı<input name="company" autoComplete="organization" value={draft.company} onChange={event => update("company", event.target.value)} maxLength={150} /></label>
        <label className="contacts-field">Telefon numarası<input name="phone" type="tel" autoComplete="tel" value={draft.phone} onChange={event => update("phone", event.target.value)} maxLength={25} placeholder="05xx xxx xx xx" /></label>
        <label className="contacts-field">E-posta<input name="email" type="email" autoComplete="email" value={draft.email} onChange={event => update("email", event.target.value)} maxLength={254} /></label>
        <label className="contacts-field contacts-field--wide">Adres<textarea name="address" autoComplete="street-address" value={draft.address} onChange={event => update("address", event.target.value)} maxLength={1000} rows={3} placeholder="Mahalle, cadde, bina, ilçe ve il" /></label>
      </fieldset>
      {error && <p className="crm-error" role="alert">{error}</p>}
      <div className="crm-form-actions"><button type="button" className="crm-button crm-button--quiet" disabled={busy} onClick={onClose}>Vazgeç</button><button className="crm-button" disabled={busy || (!!id && !detail)}>{busy ? "Kaydediliyor…" : "Kaydet"}</button></div>
    </form>}
    {detail && detail.leadCount > 0 && <details className="contacts-history"><summary>İlgili talepler ({detail.leadCount})</summary><ul>{detail.leads.map(lead => <li key={lead.id}><Link href={`/admin/talepler/${lead.id}`} prefetch={false}>{lead.reference}<span>{lead.projectType}</span></Link></li>)}</ul>{detail.leadCount > detail.leads.length && <p className="crm-muted">Son 50 talep gösteriliyor. Tüm kayıtları <Link href="/admin" prefetch={false}>Talepler</Link> ekranında bulabilirsiniz.</p>}</details>}
  </dialog>;
}

export function ContactDirectory({ initial }: { initial: ContactList }) {
  const [data, setData] = useState(initial);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [editor, setEditor] = useState<{ id: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const router = useRouter();
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setBusy(true);
      try {
        const result = await apiRequest<ContactList>(`/api/admin/crm?${new URLSearchParams({ q: query, sort, page: String(page) })}`, { signal: controller.signal });
        if (!controller.signal.aborted) { setData(result); setError(""); }
      } catch (error) {
        if (!controller.signal.aborted) {
          if (error instanceof ApiError && error.status === 401) router.replace("/admin/giris");
          else setError("Rehber yüklenemedi. Yenile düğmesiyle tekrar deneyin.");
        }
      } finally { if (!controller.signal.aborted) setBusy(false); }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query, sort, page, refresh, router]);
  const pending = busy || query.trim() !== data.query || sort !== data.sort;
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  return <>
    <div className="crm-page-heading"><div><span className="crm-overline">CRM</span><h1>Kişi rehberi</h1><p className="crm-muted">Kişilerinizin iletişim bilgileri, tek bir yerde.</p></div><button className="crm-button" onClick={() => setEditor({ id: null })}><span aria-hidden="true">＋</span>Yeni kişi ekle</button></div>
    {notice && <p className="contacts-notice" role="status">{notice}</p>}
    <section className="crm-panel" aria-label="Kişiler">
      <div className="contacts-toolbar"><label className="crm-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Ad, şirket, telefon, e-posta veya adres ara" placeholder="Ad, şirket, telefon veya adres ara…" value={query} maxLength={150} onChange={event => { setQuery(event.target.value); setPage(1); }} /></label><label className="contacts-sort"><span className="sr-only">Sıralama</span><select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="name">Ad soyad · A–Z</option><option value="company">Şirket · A–Z</option></select></label><button className="crm-icon-button" aria-label="Rehberi yenile" disabled={busy} onClick={() => setRefresh(current => current + 1)}>↻</button></div>
      {error && <p className="crm-error crm-panel-message" role="alert">{error}</p>}
      <div aria-busy={pending}>
        {!data.contacts.length ? <div className="crm-empty"><span className="crm-empty__icon" aria-hidden="true">☷</span><h2>{data.query ? "Aramanızla eşleşen kişi bulunamadı." : "Rehberiniz henüz boş."}</h2><p>{data.query ? "Ad, şirket veya iletişim bilgileriyle tekrar arayın." : "İlk kişiyi ekleyin. Web taleplerindeki kişiler de otomatik olarak burada görünür."}</p>{!data.query && <button className="crm-button crm-button--quiet" onClick={() => setEditor({ id: null })}>Yeni kişi ekle</button>}</div> : <div className="contacts-table-wrap"><table className="crm-table contacts-table"><thead><tr><th scope="col">Ad soyad</th><th scope="col">Şirket</th><th scope="col">Telefon</th><th scope="col">Adres</th><th scope="col"><span className="sr-only">İşlem</span></th></tr></thead><tbody>{data.contacts.map(contact => <tr key={contact.id}>
          <td className="contacts-person"><span className="crm-avatar" aria-hidden="true">{contact.name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toLocaleUpperCase("tr-TR")}</span><div><button className="contacts-name" onClick={() => setEditor({ id: contact.id })}>{contact.name}</button>{contact.email && <a className="contacts-email" href={`mailto:${contact.email}`}>{contact.email}</a>}</div></td>
          <td data-label="Şirket">{contact.company || <span className="crm-muted">—</span>}</td>
          <td data-label="Telefon">{contact.phone ? <a className="contacts-phone" href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>{contact.phone}</a> : <span className="crm-muted">—</span>}</td>
          <td data-label="Adres" className="contacts-address">{contact.address || <span className="crm-muted">—</span>}</td>
          <td className="contacts-actions"><button className="crm-button crm-button--quiet" aria-label={`${contact.name} bilgilerini düzenle`} onClick={() => setEditor({ id: contact.id })}>Düzenle</button></td>
        </tr>)}</tbody></table></div>}
      </div>
      <div className="crm-pagination"><span role="status">{pending ? "Yükleniyor…" : `${data.total} kişi · ${data.total ? `${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)} gösteriliyor` : "0 kayıt"}`}</span><div><button disabled={data.page <= 1 || pending} onClick={() => setPage(data.page - 1)}>← Önceki</button><span className="contacts-page">{data.page} / {pages}</span><button disabled={data.page >= pages || pending} onClick={() => setPage(data.page + 1)}>Sonraki →</button></div></div>
    </section>
    {editor && <ContactEditor id={editor.id} onClose={() => setEditor(null)} onSaved={duplicate => { setEditor(null); setNotice(duplicate ? "Bu kişi rehberde zaten kayıtlı. Mevcut bilgiler korundu." : "Kişi bilgileri kaydedildi."); setRefresh(current => current + 1); }} />}
  </>;
}
