import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findPublicPage } from "@/lib/seo-catalog";
import { getPublishedProject } from "@/lib/projects/public.server";
import { canonicalPublicPath } from "@/lib/redirects";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const path = canonicalPublicPath(new URL(request.url).searchParams.get("path") || "/");
  let page = findPublicPage(path);
  if (!page && /^\/projeler\/[a-z0-9-]{1,48}$/.test(path)) {
    const project = await getPublishedProject(path.slice("/projeler/".length));
    if (project) page = { path, title: project.name, section: "PROJELER" };
  }
  if (!page) return new Response("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  const [font, logo] = await Promise.all([readFile(join(process.cwd(), "public/fonts/AtkinsonHyperlegible-Bold.ttf")), readFile(join(process.cwd(), "public/icons/icon-192.png"))]);
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", background: "#172b24", color: "#fafbf7", fontFamily: "Atkinson" }}><div style={{ display: "flex", alignItems: "center", gap: 24 }}>
    {/* ImageResponse renders this image server-side into a PNG. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`data:image/png;base64,${logo.toString("base64")}`} alt="" width={112} height={112} style={{ borderRadius: 12 }} /><div style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 38 }}>ASIR SOLAR</span><span style={{ fontSize: 17, color: "#def37c", marginTop: 6 }}>GÜNEŞ ENERJİSİ SİSTEMLERİ</span></div></div><div style={{ display: "flex", flexDirection: "column" }}><div style={{ fontSize: 18, color: "#def37c", marginBottom: 20 }}>{page.section}</div><div style={{ fontSize: page.title.length > 85 ? 44 : 57, lineHeight: 1.15, maxWidth: 1050 }}>{page.title}</div></div><div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #52665c", paddingTop: 20, fontSize: 20 }}><span>Gebze, Kocaeli</span><span>www.asirsolar.com</span></div></div>, { width: 1200, height: 630, fonts: [{ name: "Atkinson", data: font, weight: 700, style: "normal" }], headers: { "Cache-Control": path.startsWith("/projeler/") ? "private, no-store" : "public, max-age=3600, s-maxage=86400", "X-Content-Type-Options": "nosniff" } });
}
