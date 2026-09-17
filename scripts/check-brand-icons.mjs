// Read-only checks: homepage, manifest and icon GETs. No form/provider requests.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const origin = new URL(process.argv[2] || 'http://localhost:3000').origin;
async function get(path, redirect = 'error') {
  return fetch(new URL(path, origin), { method: 'GET', redirect, signal: AbortSignal.timeout(15000) });
}
const assets = [
  ['/favicon.ico', 'app/favicon.ico', null],
  ['/icon.png', 'app/icon.png', 512],
  ['/apple-icon.png', 'app/apple-icon.png', 180],
  ['/icons/icon-192.png', 'public/icons/icon-192.png', 192],
];
for (const [url, file, size] of assets) {
  const response = await get(url);
  assert.equal(response.status, 200, url);
  assert.match(response.headers.get('content-type'), size ? /^image\/png(?:;|$)/ : /^image\/(?:x-icon|vnd\.microsoft\.icon)(?:;|$)/);
  const body = Buffer.from(await response.arrayBuffer());
  assert.deepEqual(body, await readFile(file), `${url}: served bytes match the generated company icon`);
  if (size) {
    const meta = await sharp(body).metadata();
    assert.equal(meta.width, size); assert.equal(meta.height, size);
  } else {
    assert.equal(body.readUInt16LE(0), 0); assert.equal(body.readUInt16LE(2), 1);
    const sizes = Array.from({ length: body.readUInt16LE(4) }, (_, i) => {
      const offset = 6 + 16 * i;
      const width = body[offset] || 256;
      assert.equal(width, body[offset + 1] || 256);
      return width;
    });
    assert.deepEqual(sizes, [16, 32, 48, 256]);
  }
  console.log(`PASS GET ${url}: 200, correct MIME, dimensions and company asset`);
}
const home = await get('/');
assert.equal(home.status, 200);
const html = await home.text();
const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
assert.ok(head, 'HTML head exists');
const links = [...head.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => Object.fromEntries(
  [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value.replaceAll('&amp;', '&')])
));
const pathOf = link => new URL(link.href, origin).pathname;
const icons = links.filter(link => link.rel === 'icon');
assert.equal(icons.length, 2, 'Only framework favicon.ico and icon.png references');
assert.ok(icons.some(link => pathOf(link) === '/favicon.ico'));
assert.ok(icons.some(link => pathOf(link) === '/icon.png' && link.sizes === '512x512' && link.type === 'image/png'));
const apple = links.filter(link => link.rel === 'apple-touch-icon');
assert.equal(apple.length, 1);
assert.equal(pathOf(apple[0]), '/apple-icon.png');
assert.equal(apple[0].sizes, '180x180');
for (const link of [...icons, ...apple]) assert.equal((await get(link.href)).status, 200, 'Generated head URL including cache key loads');
for (const old of ['/favicon.svg', '/icon-32.png', '/apple-touch-icon.png']) assert.ok(!head.includes(old), `No old reference: ${old}`);
const manifestLinks = links.filter(link => link.rel === 'manifest');
assert.equal(manifestLinks.length, 1);
assert.equal(pathOf(manifestLinks[0]), '/manifest.webmanifest');
const manifestResponse = await get(manifestLinks[0].href);
assert.equal(manifestResponse.status, 200);
assert.match(manifestResponse.headers.get('content-type'), /^application\/manifest\+json/);
const manifest = await manifestResponse.json();
assert.equal(manifest.name, 'Asır Solar');
assert.deepEqual(manifest.icons.map(icon => [icon.src, icon.sizes, icon.type]), [
  ['/icons/icon-192.png', '192x192', 'image/png'], ['/icon.png', '512x512', 'image/png'],
]);
assert.ok(links.some(link => link.rel === 'canonical' && link.href.replace(/\/$/, '') === 'https://www.asirsolar.com'));
for (const [old, target] of [['/favicon.svg', '/icon.png'], ['/icon-32.png', '/favicon.ico'], ['/apple-touch-icon.png', '/apple-icon.png']]) {
  const response = await get(old, 'manual');
  assert.equal(response.status, 308);
  assert.equal(new URL(response.headers.get('location'), origin).pathname, target);
}
console.log('PASS: homepage icon/apple/manifest/canonical metadata; no old head references; legacy icon redirects.');
