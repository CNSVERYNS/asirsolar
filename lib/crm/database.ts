import { AsyncLocalStorage } from "node:async_hooks";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Pool, types } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import type { PGlite } from "@electric-sql/pglite";

type Executor = { query: (sql: string, values?: unknown[]) => Promise<{ rows: unknown[] }> };
type State = { pool?: Pool; local?: PGlite; ready?: Promise<void>; context: AsyncLocalStorage<Executor> };
const globalDatabase = globalThis as typeof globalThis & { asirCrmDatabase?: State };
const state = globalDatabase.asirCrmDatabase ??= { context: new AsyncLocalStorage<Executor>() };
// All stored integers are bounded below Number.MAX_SAFE_INTEGER by validation.
types.setTypeParser(20, Number);

export const migrationPath = resolve("supabase/migrations/202609090001_crm.sql");
export async function initializeDatabase() {
  if (!state.ready) state.ready = (async () => {
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
      // TLS is mandatory for hosted databases; never disable certificate verification.
      for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) url.searchParams.delete(key);
      state.pool = new Pool({ connectionString: url.toString(), max: 3, idleTimeoutMillis: 5000, connectionTimeoutMillis: 10000,
        ssl: local ? false : { rejectUnauthorized: true, ...(process.env.DATABASE_SSL_CA ? { ca: process.env.DATABASE_SSL_CA.replaceAll("\\n", "\n") } : {}) } });
      state.pool.on("error", () => console.error("CRM database connection interrupted."));
      if (process.env.VERCEL) attachDatabasePool(state.pool);
    } else {
      if (process.env.VERCEL || (process.env.NODE_ENV === "production" && process.env.CRM_LOCAL_DATABASE !== "true")) throw new Error("Supabase DATABASE_URL is required in production.");
      const { PGlite } = await import("@electric-sql/pglite");
      const localPath = process.env.CRM_LOCAL_PATH || resolve(".data/postgres");
      if (localPath !== "memory://") await mkdir(dirname(resolve(/* turbopackIgnore: true */ localPath)), { recursive: true, mode: 0o700 });
      state.local = new PGlite(localPath);
      await state.local.waitReady;
      await state.local.exec(await readFile(migrationPath, "utf8"));
    }
  })().catch((error) => { state.ready = undefined; throw error; });
  await state.ready;
}

function sqlForPostgres(sql: string) {
  let parameter = 0;
  // This helper accepts only application SQL. User input is always a bound value.
  return sql.replace(/\?/g, () => `$${++parameter}`)
    .replace(/\b(FROM|JOIN|INTO|UPDATE)\s+(users|sessions|leads|lead_events|email_outbox|request_limits)\b/gi, "$1 asir_crm.$2")
    .replace(/\bAS ([a-z]+[A-Z]\w*)/g, 'AS "$1"');
}
async function query(sql: string, values: unknown[] = []) {
  await initializeDatabase();
  const executor: Executor = state.context.getStore() ?? state.pool ?? state.local!;
  return executor.query(sqlForPostgres(sql), values);
}
export function getDatabase() {
  return { prepare: (sql: string) => ({
    get: async (...values: unknown[]) => (await query(sql, values)).rows[0],
    all: async (...values: unknown[]) => (await query(sql, values)).rows,
    run: async (...values: unknown[]) => { await query(sql, values); },
  }) };
}
export async function transaction<T>(action: (db: ReturnType<typeof getDatabase>) => Promise<T>): Promise<T> {
  await initializeDatabase();
  if (state.context.getStore()) return action(getDatabase());
  if (state.local) return state.local.transaction((tx) => state.context.run(tx, () => action(getDatabase())));
  const client = await state.pool!.connect();
  try {
    await client.query("BEGIN");
    const result = await state.context.run(client, () => action(getDatabase()));
    await client.query("COMMIT");
    return result;
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
export async function migrateDatabase() {
  await initializeDatabase();
  if (state.pool) await state.pool.query(await readFile(migrationPath, "utf8"));
}
export async function closeDatabase() {
  await state.pool?.end(); await state.local?.close();
  state.pool = undefined; state.local = undefined; state.ready = undefined;
}
