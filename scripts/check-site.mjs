import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const origin = process.argv[2] || "http://localhost:3000";
const manifest = JSON.parse(await readFile(".next/prerender-manifest.json", "utf8"));
const routes = [...new Set([...Object.keys(manifest.routes).filter((route) => !route.startsWith("/_")), "/iletisim", "/robots.txt", "/sitemap.xml"])];
const failures = [];
for (let i = 0; i < routes.length; i += 6) {
  await Promise.all(routes.slice(i, i + 6).map(async (route) => {
    try {
      const response = await fetch(origin + route);
      if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
      await response.arrayBuffer();
    } catch (error) { failures.push(`${route}: ${error.message}`); }
  }));
}
assert.deepEqual(failures, [], "Every existing page must respond successfully");
const html = await (await fetch(origin)).text();
assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
assert.ok(html.includes('id="application-panel"'));
assert.ok(html.includes('id="mobile-menu"'));
assert.ok(html.includes("Geleceğin enerjisi."));
assert.ok(html.includes("/images/brand/asir-logo.jpeg"));
for (const project of ["Konut / Villa", "İşletme / Fabrika", "Arazi Tipi"]) {
  const content = await (await fetch(`${origin}/iletisim?proje=${encodeURIComponent(project)}`)).text();
  assert.ok(content.includes(`selected="">${project}</option>`), `Project selection preserved for ${project}`);
}
const malicious = await (await fetch(`${origin}/iletisim?proje=%3Cscript%3E`)).text();
assert.ok(malicious.includes('selected="">Diğer / Bilmiyorum</option>'));
for (const asset of ["/videos/solar-desktop.mp4", "/videos/solar-mobile.mp4"]) {
  const response = await fetch(origin + asset, { headers: { Range: "bytes=0-1023" } });
  assert.equal(response.status, 206, `${asset} supports progressive playback`);
  assert.equal(response.headers.get("content-type"), "video/mp4");
  assert.match(response.headers.get("cache-control"), /max-age=86400/);
  assert.equal((await response.arrayBuffer()).byteLength, 1024);
}
for (const asset of ["/images/brand/asir-logo.jpeg", "/images/solar-poster.webp", "/_next/image?url=%2Fimages%2Fsolar-poster.webp&w=1920&q=75"]) {
  const response = await fetch(origin + asset);
  assert.equal(response.status, 200, asset);
  assert.match(response.headers.get("content-type"), /image\//);
  await response.arrayBuffer();
}
for (const route of ["/olmayan-sayfa", "/hizmetler/olmayan-hizmet", "/rehber/olmayan-rehber"]) {
  assert.equal((await fetch(origin + route)).status, 404, route);
}
console.log(`PASS: ${routes.length} routes; home content; 3 enquiry selections; invalid input fallback; both video ranges; poster and logo; image optimization; 3 not-found routes.`);
