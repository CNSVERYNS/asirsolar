import type { EmailPurpose, Lead } from "./types.ts";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function emailLayout(title: string, content: string, origin: string) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f5f6f4;color:#18302b;font-family:Arial,sans-serif">
<table role="presentation" style="width:100%;border-collapse:collapse"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background:#fff"><tr><td style="padding:28px 32px;background:#173f35;color:#fff;font-size:24px;font-weight:bold">Asır Solar</td></tr>
<tr><td style="padding:32px;font-size:16px;line-height:1.7"><h1 style="margin:0 0 24px;font-size:25px;line-height:1.3">${escapeHtml(title)}</h1>${content}</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid #e4e9e5;color:#5a6964;font-size:13px;line-height:1.7">Asır Solar · Güneş Enerjisi Sistemleri<br><a href="${escapeHtml(origin)}" style="color:#173f35">${escapeHtml(new URL(origin).hostname)}</a></td></tr></table>
</td></tr></table></body></html>`;
}

export function renderNotificationEmail(purpose: EmailPurpose, lead: Lead, origin: string) {
  if (purpose === "customer_receipt") {
    const title = "Bizimle iletişime geçtiğiniz için teşekkür ederiz";
    // Do not reflect public form text or expose private CRM links in a customer receipt.
    const text = `Merhaba,\n\nAsır Solar ile iletişime geçtiğiniz için teşekkür ederiz. Talebinizi aldık. Mühendislerimiz projenizi inceleyerek en kısa sürede sizinle iletişime geçecek.\n\nTalep numaranız: ${lead.reference}\n\nEklemek istediğiniz bir bilgi varsa bu e-postayı yanıtlayabilirsiniz.\n\nSaygılarımızla,\nAsır Solar Ekibi\n${origin}`;
    const html = emailLayout(title, `<p>Merhaba,</p><p>Asır Solar ile iletişime geçtiğiniz için teşekkür ederiz. <strong>Talebinizi aldık.</strong> Mühendislerimiz projenizi inceleyerek en kısa sürede sizinle iletişime geçecek.</p><p style="padding:16px;background:#f1f5f2;border-left:3px solid #c99b39">Talep numaranız: <strong>${escapeHtml(lead.reference)}</strong></p><p>Eklemek istediğiniz bir bilgi varsa bu e-postayı yanıtlayabilirsiniz.</p><p>Saygılarımızla,<br><strong>Asır Solar Ekibi</strong></p>`, origin);
    return { subject: `Talebinizi aldık · Asır Solar · ${lead.reference}`, text, html };
  }
  const link = `${origin}/admin/talepler/${encodeURIComponent(lead.id)}`;
  const fields = [["Ad Soyad", lead.name], ["Firma", lead.company || "—"], ["Telefon", lead.phone], ["E-posta", lead.email], ["Proje", lead.projectType]];
  const text = `Web sitesinden yeni bir talep geldi.\n\n${fields.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${lead.message}\n\nPanelde aç: ${link}\n\nBu e-postayı yanıtlayarak müşteriyle iletişime geçebilirsiniz.`;
  const html = emailLayout("Yeni keşif talebi", `<p>Web sitesinden yeni bir talep geldi. <strong>${escapeHtml(lead.reference)}</strong></p><table role="presentation" style="width:100%;font-size:15px;line-height:1.6;border-collapse:collapse">${fields.map(([label, value]) => `<tr><td style="padding:8px 12px 8px 0;vertical-align:top;color:#5a6964">${label}</td><td style="padding:8px 0;overflow-wrap:anywhere">${escapeHtml(value)}</td></tr>`).join("")}</table><p style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(lead.message)}</p><p><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 20px;background:#173f35;color:#fff;text-decoration:none;border-radius:6px">Talebi panelde aç</a></p><p style="font-size:14px;color:#5a6964">Bu e-postayı yanıtlayarak müşteriyle iletişime geçebilirsiniz.</p>`, origin);
  return { subject: `Yeni keşif talebi · ${lead.reference}`, text, html };
}

const smsProjectLabels: Record<string, string> = {
  "Konut / Villa": "konut / villa projesi", "İşletme / Fabrika": "işletme / fabrika projesi",
  "Çatı Tipi": "çatı projesi", "Cephe Tipi": "cephe projesi", "Arazi Tipi": "arazi projesi",
  "Elektrik ve Pano Sistemleri": "elektrik ve pano sistemleri", "Bakım / Teknik Destek": "bakım / teknik destek",
};
export function renderTeamSms(lead: Pick<Lead, "id" | "name" | "projectType">, origin: string) {
  const name = lead.name.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  return `Asır Solar: ${name}, ${smsProjectLabels[lead.projectType] || "projesi"} için sizinle iletişime geçmek istiyor. Talep: ${origin}/admin/talepler/${encodeURIComponent(lead.id)}`;
}
