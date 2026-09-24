"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
const ExitOffer = dynamic(() => import("./ExitOffer"), { ssr: false });
const sessionKey = "asir-solar-feasibility-offer-shown";
export function ExitIntent() {
  const pathname = usePathname(), shown = useRef(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (pathname === "/iletisim" || pathname === "/hesaplayici" || !window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches) return;
    const start = performance.now();
    const leave = (event: MouseEvent) => {
      if (shown.current || event.clientY > 0 || performance.now() - start < 45000 || scrollY < 250 || document.querySelector("dialog[open]") || document.querySelector('.cookie-banner[data-visible="true"]') || document.activeElement?.matches("input,textarea,select,[contenteditable=true]")) return;
      try { if (sessionStorage.getItem(sessionKey)) return; sessionStorage.setItem(sessionKey, "true"); } catch { /* The in-memory guard still prevents repeats on this page. */ }
      shown.current = true; setOpen(true);
    };
    document.documentElement.addEventListener("mouseleave", leave);
    return () => document.documentElement.removeEventListener("mouseleave", leave);
  }, [pathname]);
  return open ? <ExitOffer onClose={() => setOpen(false)} /> : null;
}
