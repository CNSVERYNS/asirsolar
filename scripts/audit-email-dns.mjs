// Read-only public DNS audit. No provider credentials, DNS writes or email calls.
// Usage: node scripts/audit-email-dns.mjs
import { Resolver } from 'node:dns/promises';
import { createPublicKey, createHash } from 'node:crypto';

const domain = 'asirsolar.com';
const questions = [
  [domain, 'NS'], [domain, 'MX'], [domain, 'TXT'],
  [`zmail._domainkey.${domain}`, 'TXT'], [`16151140._domainkey.${domain}`, 'TXT'],
  [`_dmarc.${domain}`, 'TXT'], [`default._bimi.${domain}`, 'TXT'],
  [`bounce-zem.${domain}`, 'CNAME'], [`bounce-zem.${domain}`, 'TXT'],
  ['zohomail.com', 'TXT'], ['spf.zohomail.com', 'TXT'], ['zeptomail.net', 'TXT'],
];
async function audit(server) {
  const resolver = new Resolver({ timeout: 4000, tries: 2 });
  resolver.setServers([server]);
  const records = await Promise.all(questions.map(async ([name, type]) => {
    try {
      const answer = await resolver.resolve(name, type);
      const values = type === 'TXT' ? answer.map(parts => parts.join('')) : answer;
      // Public verification tokens are unrelated to SPF/DKIM/DMARC/BIMI.
      const relevant = type !== 'TXT' ? values : values.filter(value =>
        /^(?:v=(?:spf1|DMARC1|BIMI1|DKIM1)\b|k=rsa\s*;)/i.test(value));
      return { name, type, status: relevant.length ? 'present' : 'absent', values: relevant };
    } catch (error) {
      return { name, type, status: ['ENODATA', 'ENOTFOUND'].includes(error.code) ? 'absent' : 'query_error', error: error.code };
    }
  }));
  const root = records.find(row => row.name === domain && row.type === 'TXT');
  const spf = root.values?.filter(value => /^v=spf1\b/i.test(value)) || [];
  const dkim = records.filter(row => row.name.includes('._domainkey.')).map(row => {
    const text = row.values?.[0];
    const value = text?.match(/(?:^|;)\s*p=([^;]+)/)?.[1].replace(/\s/g, '');
    if (!value) return { name: row.name, keyParsed: false };
    try {
      const der = Buffer.from(value, 'base64');
      const key = createPublicKey({ key: der, format: 'der', type: 'spki' });
      return { name: row.name, keyParsed: true, type: key.asymmetricKeyType, bits: key.asymmetricKeyDetails?.modulusLength, publicKeySha256: createHash('sha256').update(der).digest('hex') };
    } catch { return { name: row.name, keyParsed: false }; }
  });
  return { resolver: server, spfRecordCount: root.status === 'query_error' ? null : spf.length,
    zohoMailIncluded: spf.length === 1 && /(?:^|\s)include:zohomail\.com(?:\s|$)/i.test(spf[0]), dkim, records };
}
const results = await Promise.all(['1.1.1.1', '8.8.8.8'].map(audit));
console.log(JSON.stringify({ observedAt: new Date().toISOString(), domain, results,
  limitation: 'Public DNS presence is not evidence that a delivered message passed SPF/DKIM/DMARC alignment.' }, null, 2));
if (results.some(result => result.records.some(row => row.status === 'query_error'))) process.exitCode = 1;
