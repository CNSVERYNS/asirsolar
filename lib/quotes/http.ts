import "server-only";
import { CrmError } from "../crm/validation.ts";
import { MAX_QUOTE_FILE_BYTES } from "./types.ts";

export async function readQuoteUpload(request: Request) {
  const mime = request.headers.get("content-type") || "";
  if (!["application/pdf", "image/png", "image/jpeg"].includes(mime)) throw new CrmError("PDF, PNG veya JPG dosyası seçin.", 415);
  if (Number(request.headers.get("content-length") || 0) > MAX_QUOTE_FILE_BYTES) throw new CrmError("Dosya en fazla 3 MB olabilir.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new CrmError("Dosya seçin.");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const chunk = await reader.read(); if (chunk.done) break;
    length += chunk.value.byteLength;
    if (length > MAX_QUOTE_FILE_BYTES) { await reader.cancel(); throw new CrmError("Dosya en fazla 3 MB olabilir.", 413); }
    chunks.push(chunk.value);
  }
  let filename: string;
  try { filename = decodeURIComponent(request.headers.get("x-file-name") || "teklif"); } catch { throw new CrmError("Dosya adı geçersiz."); }
  if (filename.length > 255) throw new CrmError("Dosya adı çok uzun.");
  return { bytes: Buffer.concat(chunks), mime, filename };
}
export function quoteFileResponse(file: { data: Uint8Array; filename: string; mimeType: string }) {
  return new Response(Buffer.from(file.data), { headers: {
    "Content-Type": file.mimeType, "Content-Length": String(file.data.length),
    "Content-Disposition": `attachment; filename="teklif.${file.mimeType === "application/pdf" ? "pdf" : file.mimeType === "image/png" ? "png" : "jpg"}"; filename*=UTF-8''${encodeURIComponent(file.filename).replace(/['()*]/g, c => "%" + c.charCodeAt(0).toString(16))}`,
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow, noarchive", "Content-Security-Policy": "sandbox; default-src 'none'", "X-Frame-Options": "DENY",
  } });
}
