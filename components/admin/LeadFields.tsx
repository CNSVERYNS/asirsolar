import { projectTypes } from "@/lib/enquiry";
import { sources, stages, type AdminUser, type Lead } from "@/lib/crm/types";

export type LeadDraft = { name: string; phone: string; email: string; company: string; projectType: string; message: string; source: string; stage: string; assigneeId: string; priority: string; nextFollowUp: string; quoteAmount: string; rejectionReason: string };
export function emptyDraft(): LeadDraft { return { name: "", phone: "", email: "", company: "", projectType: "Diğer / Bilmiyorum", message: "", source: "phone", stage: "new", assigneeId: "", priority: "normal", nextFollowUp: "", quoteAmount: "", rejectionReason: "" }; }
export function draftFromLead(lead: Lead): LeadDraft { return { ...lead, assigneeId: lead.assigneeId || "", nextFollowUp: lead.nextFollowUp || "", quoteAmount: lead.quoteCents === null ? "" : (lead.quoteCents / 100).toFixed(2) }; }

export function LeadFields({ draft, setDraft, users, existing = false, disabled = false }: { draft: LeadDraft; setDraft: (value: LeadDraft) => void; users: AdminUser[]; existing?: boolean; disabled?: boolean }) {
  const update = (field: keyof LeadDraft, value: string) => setDraft({ ...draft, [field]: value });
  return <fieldset className="crm-fields" disabled={disabled}>
    <label className="crm-field">Ad soyad / İlgili kişi *<input value={draft.name} onChange={(e) => update("name", e.target.value)} required maxLength={100} autoComplete="off" /></label>
    <label className="crm-field">Firma / Kurum<input value={draft.company} onChange={(e) => update("company", e.target.value)} maxLength={150} autoComplete="off" /></label>
    <label className="crm-field">Telefon<input type="tel" value={draft.phone} onChange={(e) => update("phone", e.target.value)} maxLength={25} autoComplete="off" /></label>
    <label className="crm-field">E-posta<input type="email" value={draft.email} onChange={(e) => update("email", e.target.value)} maxLength={254} autoComplete="off" /></label>
    <p className="crm-field-help crm-span">Telefon veya e-posta bilgilerinden en az birini girin.</p>
    <label className="crm-field">Geliş kaynağı<select value={draft.source} disabled={existing} onChange={(e) => update("source", e.target.value)}>{sources.filter((item) => existing || item.id !== "website").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <label className="crm-field">Proje türü<select value={draft.projectType} onChange={(e) => update("projectType", e.target.value)}>{projectTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
    <label className="crm-field">Aşama<select value={draft.stage} onChange={(e) => update("stage", e.target.value)}>{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select></label>
    <label className="crm-field">Sorumlu kişi<select value={draft.assigneeId} onChange={(e) => update("assigneeId", e.target.value)}><option value="">Henüz atanmadı</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
    <label className="crm-field">Öncelik<select value={draft.priority} onChange={(e) => update("priority", e.target.value)}><option value="normal">Normal</option><option value="high">Yüksek öncelik</option></select></label>
    <label className="crm-field">Sonraki takip tarihi<input type="date" value={draft.nextFollowUp} onChange={(e) => update("nextFollowUp", e.target.value)} /></label>
    <label className="crm-field">Teklif tutarı (TL)<input type="number" min="0" max="9999999999.99" step="0.01" placeholder="Henüz belirlenmedi" value={draft.quoteAmount} onChange={(e) => update("quoteAmount", e.target.value)} /></label>
    {draft.stage === "lost" && <label className="crm-field crm-span">Red nedeni *<textarea value={draft.rejectionReason} onChange={(e) => update("rejectionReason", e.target.value)} required minLength={3} maxLength={1000} rows={2} placeholder="Örneğin: bütçe, zamanlama veya farklı çözüm tercihi." /></label>}
    <label className="crm-field crm-span">Proje bilgisi<textarea rows={4} value={draft.message} onChange={(e) => update("message", e.target.value)} maxLength={3000} placeholder="İhtiyaçlar, konum ve ilk görüşme bilgileri…" /></label>
  </fieldset>;
}
