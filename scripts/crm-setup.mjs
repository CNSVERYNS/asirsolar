import env from '@next/env';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
env.loadEnvConfig(process.cwd());
const { migrateDatabase, closeDatabase } = await import('../lib/crm/database.ts');
const { adminAccounts, listUsers, provisionAdmin } = await import('../lib/crm/auth.ts');
try {
  await migrateDatabase();
  const users = await listUsers();
  const reset = process.argv.includes('--reset');
  const requested = process.argv.find(arg => arg.startsWith('--email='))?.slice(8);
  if (requested && !adminAccounts.some(account => account.email === requested)) throw new Error('Unknown admin email.');
  const lines = ['ASIR SOLAR — PRIVATE ADMIN ACCESS', 'Change these passwords after the first login. Do not commit or share this file publicly.', ''];
  for (const account of adminAccounts.filter(account => !requested || account.email === requested)) {
    if (users.some(user => user.id === account.id) && !reset) continue;
    const password = randomBytes(24).toString('base64url');
    await provisionAdmin(account.email, password, reset);
    lines.push(`${account.name}\n${account.email}\n${password}\n`);
  }
  if (lines.length > 3) {
    await mkdir('.local-tools', { recursive: true, mode: 0o700 });
    const path = resolve(`.local-tools/admin-access-${Date.now()}.txt`);
    await writeFile(path, lines.join('\n'), { mode: 0o600, flag: 'wx' });
    console.log(`Admin accounts ready. Private credentials: ${path}`);
  } else console.log('Existing accounts preserved. Use --reset --email=... only to reset a password.');
} catch (error) {
  console.error('CRM setup failed:', error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[redacted]') : 'Unknown error');
  process.exitCode = 1;
} finally { await closeDatabase(); }
