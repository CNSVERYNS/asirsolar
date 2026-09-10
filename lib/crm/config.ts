export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL) || (!process.env.VERCEL && (process.env.NODE_ENV !== "production" || process.env.CRM_LOCAL_DATABASE === "true"));
}
