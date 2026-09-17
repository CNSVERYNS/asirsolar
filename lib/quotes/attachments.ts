import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { transaction } from "../crm/database.ts";
import { CrmError } from "../crm/validation.ts";
import type { AdminUser } from "../crm/types.ts";
import { MAX_QUOTE_FILES, MAX_QUOTE_FILE_BYTES } from "./types.ts";
import { lockQuote, quoteEvent, quoteRecord } from "./repository.ts";

export function safeFilename(value: string, extension: string) {
  const basename = value.split(/[\\/]/).pop() || "teklif";
  const stem = basename.replace(/\.[^.]*$/, "").normalize("NFC").replace(/[^\p{L}\p{N} _.-]/gu, "").replace(/^\.+/, "").trim().slice(0, 100) || "teklif";
  return `${stem}.${extension}`;
}
export async function validateQuoteFile(bytes: Buffer, mime: string, filename: string) {
  if (!bytes.length || bytes.length > MAX_QUOTE_FILE_BYTES) throw new CrmError("Her dosya en fazla 3 MB olabilir.", 413);
  if (!["application/pdf", "image/jpeg", "image/png"].includes(mime)) throw new CrmError("Yalnızca PDF, PNG ve JPG dosyaları kabul edilir.", 415);
  let data = bytes;
  if (mime === "application/pdf") {
    if (!/^%PDF-(1\.[0-7]|2\.0)[\r\n]/.test(bytes.subarray(0, 16).toString("ascii")) || !/%%EOF\s*$/.test(bytes.subarray(-1024).toString("latin1"))) throw new CrmError("Geçerli bir PDF dosyası seçin.");
    // Defence in depth, not a malware scanner. PDFs are always downloaded, never embedded in the site.
    if (/\/(JavaScript|JS|Launch|EmbeddedFile|RichMedia|OpenAction|AA)\b/.test(bytes.toString("latin1"))) throw new CrmError("Aktif içerik veya ek dosya içermeyen bir PDF yükleyin.");
  } else {
    try {
      const image = sharp(bytes, { limitInputPixels: 25_000_000, failOn: "warning" });
      const metadata = await image.metadata();
      if (metadata.format !== (mime === "image/png" ? "png" : "jpeg") || (metadata.pages ?? 1) > 1) throw new Error("mime");
      // Decode/re-encode to remove metadata, appended payloads and malformed images.
      data = await (mime === "image/png" ? image.rotate().png() : image.rotate().jpeg({ quality: 92 })).toBuffer();
    } catch { throw new CrmError("Dosya içeriği seçilen görsel türüyle uyuşmuyor."); }
  }
  if (data.length > MAX_QUOTE_FILE_BYTES) throw new CrmError("İşlenen dosya 3 MB sınırını aşıyor.", 413);
  return { data, mime, filename: safeFilename(filename, mime === "application/pdf" ? "pdf" : mime === "image/png" ? "png" : "jpg"), hash: createHash("sha256").update(data).digest("hex") };
}
export async function addQuoteAttachment(id: string, bytes: Buffer, mime: string, filename: string, editVersion: number, actor: AdminUser) {
  const file = await validateQuoteFile(bytes, mime, filename);
  return transaction(async db => {
    const quote = await lockQuote(id);
    if (quote.status !== "draft" || quote.editVersion !== editVersion) throw new CrmError("Teklif değişti veya gönderildi. Güncel sürümü yükleyin.", 409);
    const duplicate = await db.prepare("SELECT id FROM asir_crm.quote_attachments WHERE quote_id=? AND sha256=?").get(id, file.hash);
    if (duplicate) return quote;
    if (quote.attachments.length >= MAX_QUOTE_FILES) throw new CrmError("Bir sürüme en fazla 5 dosya eklenebilir.");
    await db.prepare("INSERT INTO asir_crm.quote_attachments(id,quote_id,original_filename,mime_type,size_bytes,data,sha256,created_at) VALUES(?,?,?,?,?,?,?,?)").run(randomUUID(), id, file.filename, file.mime, file.data.length, file.data, file.hash, new Date().toISOString());
    await db.prepare("UPDATE asir_crm.quotes SET edit_version=edit_version+1,updated_at=? WHERE id=?").run(new Date().toISOString(), id);
    await quoteEvent(quote, "quote_updated_draft", `Dosya eklendi: ${file.filename}`, "admin", actor.id);
    return quoteRecord(id);
  });
}
export async function removeQuoteAttachment(id: string, fileId: string, editVersion: number, actor: AdminUser) {
  return transaction(async db => {
    const quote = await lockQuote(id);
    if (quote.status !== "draft" || quote.editVersion !== editVersion) throw new CrmError("Teklif değişti veya gönderildi. Güncel sürümü yükleyin.", 409);
    const file = quote.attachments.find(file => file.id === fileId);
    if (!file) throw new CrmError("Dosya bulunamadı.", 404);
    await db.prepare("DELETE FROM asir_crm.quote_attachments WHERE id=? AND quote_id=?").run(fileId, id);
    await db.prepare("UPDATE asir_crm.quotes SET edit_version=edit_version+1,updated_at=? WHERE id=?").run(new Date().toISOString(), id);
    await quoteEvent(quote, "quote_updated_draft", `Dosya kaldırıldı: ${file.filename}`, "admin", actor.id);
    return quoteRecord(id);
  });
}
