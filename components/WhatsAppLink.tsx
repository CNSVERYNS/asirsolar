import { whatsappContact } from "@/lib/whatsapp";

function WhatsAppIcon() {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.5 0 .1 5.4.1 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6a12 12 0 0 0 5.9 1.5H12C18.6 23.9 24 18.5 24 12c0-3.2-1.2-6.2-3.5-8.5ZM12 21.9a10 10 0 0 1-5.1-1.4l-.4-.2-3.7 1 1-3.6-.3-.4a9.8 9.8 0 0 1-1.5-5.3A10 10 0 0 1 12.1 2a10 10 0 0 1 7 2.9A9.8 9.8 0 0 1 22 12c0 5.5-4.5 9.9-10 9.9Zm5.5-7.4c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.2 8.2 0 0 1-2.5-1.5 9.3 9.3 0 0 1-1.8-2.2c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5L8.7 6.6c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.2 4.7.7.3 1.3.5 1.7.6.7.2 1.4.2 2 .1.6-.1 1.8-.7 2.1-1.5.2-.7.2-1.3.2-1.5-.1-.1-.3-.2-.6-.4Z" /></svg>;
}

export function WhatsAppLink({ variant = "floating" }: { variant?: "floating" | "mobile" | "inline" }) {
  if (!whatsappContact) return null;
  return <a href={whatsappContact.href} className={`whatsapp-link whatsapp-link--${variant}`} target="_blank" rel="noopener noreferrer"
    aria-label={`${whatsappContact.name} ile WhatsApp üzerinden görüşün (yeni sekme)`} title={`${whatsappContact.name} ile WhatsApp üzerinden görüşün`}>
    <WhatsAppIcon /><span>{variant === "inline" ? `${whatsappContact.name} · WhatsApp` : "WhatsApp"}</span>
  </a>;
}
