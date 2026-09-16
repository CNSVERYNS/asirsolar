import sharp from "sharp";
import { getProjectImage } from "./repository.ts";

// Image IDs are immutable. Visibility is checked in the route on every request,
// before either a cached variant or a browser's cached copy may be served.
const variants = new Map<string, Buffer>();
const pending = new Map<string, Promise<Buffer | undefined>>();
let cachedBytes = 0;
const MAX_CACHE_BYTES = 24 * 1024 * 1024;
export function projectImageWidth(value: string | null) {
  const requested = Number(value);
  if (!Number.isFinite(requested) || requested <= 0) return 2000;
  return [640, 960, 1440, 2000].find(width => width >= requested) ?? 2000;
}
export function projectImageEtag(id: string, width: number) { return `"project-${id}-${width}-v1"`; }
export async function projectImageVariant(id: string, width: number): Promise<Buffer | undefined> {
  const key = `${id}:${width}`;
  const cached = variants.get(key);
  if (cached) { variants.delete(key); variants.set(key, cached); return cached; }
  const running = pending.get(key);
  if (running) return running;
  const generate = (async () => {
    const original = await getProjectImage(id, true);
    if (!original) return undefined;
    const source = Buffer.from(original.data);
    const data = width === 2000 ? source : await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    while (cachedBytes + data.length > MAX_CACHE_BYTES && variants.size) {
      const oldest = variants.keys().next().value!;
      cachedBytes -= variants.get(oldest)!.length; variants.delete(oldest);
    }
    variants.set(key, data); cachedBytes += data.length;
    return data;
  })();
  pending.set(key, generate);
  try { return await generate; } finally { pending.delete(key); }
}
