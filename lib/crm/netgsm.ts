import { DeliveryError } from "./notification-errors.ts";

// Official REST v2 contract: https://www.netgsm.com.tr/dokuman/
// Fixed origin: credentials can never be redirected to a configurable endpoint.
const base = "https://api.netgsm.com.tr/sms/rest/v2";
async function request(path: "/send" | "/report", body: unknown) {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${process.env.CRM_NETGSM_USERCODE}:${process.env.CRM_NETGSM_PASSWORD}`).toString("base64")}` },
      body: JSON.stringify(body),
    });
  } catch { throw new DeliveryError("sms_response_unknown", false, true); }
  let data: Record<string, unknown>;
  try { data = await response.json(); }
  catch { throw new DeliveryError("sms_response_invalid", false, true); }
  if (!data || typeof data !== "object") throw new DeliveryError("sms_response_invalid", false, true);
  const code = String(data.code ?? "");
  if (response.ok && ["00", "01", "02"].includes(code)) return data;
  if (["20", "30", "40", "50", "51", "70", "80", "85"].includes(code)) {
    throw new DeliveryError(`netgsm_${code}`, ["80", "85"].includes(code));
  }
  throw new DeliveryError("sms_response_unknown", false, true);
}
export async function sendNetgsmSms(recipient: string, text: string, reference: string) {
  if (!/^\+905\d{9}$/.test(recipient)) throw new DeliveryError("sms_recipient_invalid");
  const data = await request("/send", {
    msgheader: process.env.CRM_NETGSM_HEADER?.trim(), messages: [{ msg: text, no: recipient.slice(3) }],
    encoding: "TR", iysfilter: "0", appname: "AsirSolarCRM", referansID: reference,
  });
  if (typeof data.jobid !== "string" || !/^\d{1,80}$/.test(data.jobid)) throw new DeliveryError("sms_response_invalid", false, true);
  return data.jobid;
}
export type SmsReport = { jobid: string; number: string; status: number; errorCode: string };
export async function readNetgsmReports(jobids: string[]): Promise<SmsReport[]> {
  if (!jobids.length) return [];
  const data = await request("/report", { jobids: [...new Set(jobids)], pagesize: 100, pagenumber: 1 });
  if (!Array.isArray(data.jobs)) throw new DeliveryError("sms_report_invalid");
  return data.jobs.flatMap((row: unknown) => {
    if (!row || typeof row !== "object") return [];
    const value = row as Record<string, unknown>;
    if (typeof value.jobid !== "string" || typeof value.number !== "string" || !Number.isInteger(Number(value.status))) return [];
    return [{ jobid: value.jobid, number: value.number.replace(/\D/g, "").slice(-10), status: Number(value.status), errorCode: String(value.errorCode ?? "").replace(/[^\d]/g, "").slice(0, 5) }];
  });
}
