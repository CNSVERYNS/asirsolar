import assert from "node:assert/strict";

const target = new URL(process.argv[2] || "http://localhost:3000").origin;
const canonicalOrigin = new URL(process.argv[3] || "https://asirsolar.vercel.app").origin;
const read = async path => {
  const response = await fetch(new URL(path, target), { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, path);
  return response.text();
};
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const metadata = (html, name) => [...html.matchAll(/<meta\b[^>]*>/g)].map(m => m[0]).find(tag => attr(tag, "name") === name);
const schemas = html => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m => {
  const data = JSON.parse(m[1]);
  return data["@graph"] || [data];
});
const sitemap = await read("/sitemap.xml");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
assert.ok(urls.length > 50);
assert.equal(new Set(urls).size, urls.length);
assert.ok(urls.every(url => new URL(url).origin === canonicalOrigin));
assert.ok(urls.every(url => !/\/(admin|api|kvkk|gizlilik-politikasi|cerez-politikasi)(\/|$)/.test(new URL(url).pathname)));
const robots = await read("/robots.txt");
assert.match(robots, /Disallow: \/admin/);
assert.match(robots, /Disallow: \/api\//);
assert.ok(robots.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`));
for (let i = 0; i < urls.length; i += 5) {
  await Promise.all(urls.slice(i, i + 5).map(async url => {
    const path = new URL(url).pathname;
    const html = await read(path);
    const canonical = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)];
    assert.equal(canonical.length, 1, `${path}: one canonical`);
    assert.equal(attr(canonical[0][0], "href").replace(/\/$/, ""), url.replace(/\/$/, ""), path);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${path}: one heading`);
    assert.ok(!metadata(html, "robots")?.includes("noindex"), `${path}: sitemap page indexable`);
    assert.ok(attr(metadata(html, "description") || "", "content")?.length > 20, `${path}: description`);
    const items = schemas(html);
    const business = items.find(item => item["@type"] === "LocalBusiness");
    assert.equal(business?.["@id"], `${canonicalOrigin}/#organization`, path);
    assert.equal(business?.telephone, "+902626446989", path);
    assert.equal(business?.address?.addressLocality, "Gebze", path);
    assert.equal(business?.hasOfferCatalog?.itemListElement?.length, 6, path);
    assert.ok(!business.aggregateRating && !business.review, `${path}: no invented reviews`);
    if (path.startsWith("/hizmetler/")) {
      assert.equal(items.find(item => item["@type"] === "Service")?.provider?.["@id"], business["@id"]);
      assert.ok(html.includes("Görüşme öncesi hazırlık"));
    }
    if (path.startsWith("/rehber/")) assert.equal(items.find(item => item["@type"] === "Article")?.publisher?.["@id"], business["@id"]);
    for (const tag of html.matchAll(/<a\b[^>]*href="https:\/\/wa\.me\/[^>]*>/g)) {
      assert.match(attr(tag[0], "href"), /^https:\/\/wa\.me\/[1-9]\d{6,14}\?text=/);
      assert.equal(attr(tag[0], "target"), "_blank");
      assert.ok(attr(tag[0], "rel").includes("noopener"));
    }
  }));
}
const roi = await read("/rehber/yatirimin-geri-donusu-nasil-hesaplanir");
assert.ok(roi.includes('id="hesaplama"'));
assert.ok(roi.includes('datetime="2026-09-10"') || roi.includes('dateTime="2026-09-10"'));
assert.equal((roi.match(/id="calc-/g) || []).length, 6);
for (const path of ["/admin/giris", "/projeler"]) {
  const html = await read(path);
  if (metadata(html, "robots")?.includes("noindex")) assert.ok(!urls.includes(`${canonicalOrigin}${path}`));
  if (path.startsWith("/admin")) {
    assert.ok(!schemas(html).some(item => item["@type"] === "LocalBusiness"));
    assert.ok(!html.includes('class="whatsapp-link'));
  }
}
console.log(`PASS: ${urls.length} sitemap pages; canonical, metadata, headings, business/service/article graph; robots and private page exclusions; calculator and WhatsApp link safety.`);
