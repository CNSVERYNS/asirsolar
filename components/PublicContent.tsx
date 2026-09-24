"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Keep organization markup out of private CRM and customer quote documents.
export function PublicContent({ children }: { children: ReactNode }) {
  const path = usePathname();
  return path === "/admin" || path.startsWith("/admin/") || path.startsWith("/teklif/") ? null : children;
}
