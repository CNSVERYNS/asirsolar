import { timingSafeEqual } from "node:crypto";
import { api, json } from "@/lib/crm/http";
import { processNotifications } from "@/lib/crm/notifications.server";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return json({ error: "Yetkisiz istek." }, 401);
  return api(async () => json(await processNotifications()));
}
export const POST = GET;
