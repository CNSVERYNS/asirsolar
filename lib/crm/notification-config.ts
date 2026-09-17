// Server-side module. Never import recipients/configuration into a client component.
// Explicit import boundary is enforced by the server-only notifications entrypoint.
import { parseEmailAddress } from "./email-address.ts";
export const notificationRecipients = [
  { id: "onur", name: "Onur Durak", email: "onur.durak@asirsolar.com", phone: "+905419243545" },
  { id: "furkan", name: "Furkan Cansever", email: "furkan.cansever@asirsolar.com", phone: "+905431185861" },
] as const;

export function emailProvider() {
  // Preserve existing SMTP deployments when no provider was selected.
  return process.env.CRM_EMAIL_PROVIDER?.trim() || "smtp";
}
export function emailConfigured() {
  if (!parseEmailAddress(process.env.CRM_EMAIL_FROM)
    || !parseEmailAddress(process.env.CRM_EMAIL_REPLY_TO || process.env.CRM_EMAIL_FROM)) return false;
  try { validNotificationOrigin(); } catch { return false; }
  if (emailProvider() === "zeptomail") {
    const token = process.env.CRM_ZEPTOMAIL_TOKEN;
    return Boolean(token && !/\s/.test(token));
  }
  return emailProvider() === "smtp" && Boolean(process.env.CRM_SMTP_HOST?.trim()
    && process.env.CRM_SMTP_USER?.trim() && process.env.CRM_SMTP_PASSWORD);
}
export function smsConfigured() {
  return process.env.CRM_SMS_PROVIDER === "netgsm" && Boolean(process.env.CRM_NETGSM_USERCODE?.trim()
    && process.env.CRM_NETGSM_PASSWORD && process.env.CRM_NETGSM_HEADER?.trim() && process.env.APP_ORIGIN);
}
export function emailEnabled() { return process.env.CRM_EMAIL_ENABLED === "true" && emailConfigured(); }
export function smsEnabled() { return process.env.CRM_SMS_ENABLED === "true" && smsConfigured(); }
export function validNotificationOrigin() {
  const url = new URL(process.env.APP_ORIGIN || "");
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("notification_origin_invalid");
  return url.origin;
}
