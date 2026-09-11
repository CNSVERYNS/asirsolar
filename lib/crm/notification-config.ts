// Server-side module. Never import recipients/configuration into a client component.
// Explicit import boundary is enforced by the server-only notifications entrypoint.
export const notificationRecipients = [
  { id: "onur", name: "Onur Durak", email: "onur.durak@asirsolar.com", phone: "+905419243545" },
  { id: "furkan", name: "Furkan Cansever", email: "furkan.cansever@asirsolar.com", phone: "+905431185861" },
] as const;

export function emailConfigured() {
  return Boolean(process.env.CRM_SMTP_HOST?.trim() && process.env.CRM_SMTP_USER?.trim()
    && process.env.CRM_SMTP_PASSWORD && process.env.CRM_EMAIL_FROM?.trim() && process.env.APP_ORIGIN);
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
